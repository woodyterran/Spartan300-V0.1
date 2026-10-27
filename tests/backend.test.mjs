import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createBackend } from '../backend.mjs';

async function fixture(t, existingPath) {
  const directory=existingPath?path.dirname(existingPath):await mkdtemp(path.join(os.tmpdir(),'spartan-admin-test-'));
  const dataPath=existingPath || path.join(directory,'store.json');
  const backend=await createBackend({dataPath});
  const server=http.createServer(async(req,res)=>{if(!await backend.handle(req,res,new URL(req.url,'http://localhost'))){res.writeHead(404);res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const client=()=>{let cookie='';return async(route,method='GET',body,origin=base)=>{const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});const received=response.headers.getSetCookie();if(received.length)cookie=received.map(c=>c.split(';')[0]).join('; ');return {status:response.status,body:await response.json()};};};
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));if(!existingPath)await rm(directory,{recursive:true,force:true});});
  return {client,dataPath};
}
async function loginUser(client,phone='13800138000'){const result=await client('/api/auth/login','POST',{phone,password:'spartan300'});assert.equal(result.status,200);return result.body;}
async function loginAdmin(client){const result=await client('/api/admin/login','POST',{username:'admin',password:'spartan300-admin'});assert.equal(result.status,200);}
async function submit(client){return client('/api/me/settlements','POST',{contact:'13800138000',wechat:'demo-test',expectedAmount:400});}

test('admin authentication is separate from user authentication and never returns password records',async t=>{
  const f=await fixture(t),anonymous=f.client(),user=f.client(),admin=f.client();
  assert.equal((await anonymous('/api/admin/snapshot')).status,401);
  await loginUser(user);assert.equal((await user('/api/admin/snapshot')).status,401);
  assert.equal((await admin('/api/admin/login','POST',{username:'admin',password:'wrong'})).status,401);
  await loginAdmin(admin);const result=await admin('/api/admin/snapshot');assert.equal(result.status,200);assert.equal(result.body.users.length,6);
  assert.ok(!JSON.stringify(result.body).includes('legacyDigest'));assert.ok(!JSON.stringify(result.body).includes('"password"'));
});

test('full settlement reservation is atomic and concurrent submissions cannot double reserve',async t=>{
  const f=await fixture(t),user=f.client();await loginUser(user);
  const results=await Promise.all([submit(user),submit(user)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  const current=(await user('/api/me')).body;assert.equal(current.wallet.balance,0);assert.equal(current.wallet.settlements.filter(s=>s.status==='pending').length,1);assert.equal(current.wallet.settlements[0].amount,400);
});

test('payment registration requires explicit confirmation, synchronizes to the user, and is idempotent',async t=>{
  const f=await fixture(t),user=f.client(),admin=f.client();await loginUser(user);await loginAdmin(admin);const item=(await submit(user)).body.settlement;
  const route=`/api/admin/settlements/${item.id}/decision`;
  assert.equal((await admin(route,'POST',{action:'paid'})).status,400);
  assert.equal((await admin(route,'POST',{action:'paid',confirmed:true,note:'演示登记，不是真实转账',reference:'TEST-001'})).status,200);
  assert.equal((await admin(route,'POST',{action:'paid',confirmed:true})).status,409);
  assert.equal((await user(`/api/me/settlements/${item.id}/cancel`,'POST',{})).status,409);
  const current=(await user('/api/me')).body;assert.equal(current.wallet.balance,0);assert.equal(current.wallet.paid,400);assert.equal(current.wallet.settlements[0].status,'paid');assert.equal(current.wallet.settlements[0].reference,'TEST-001');
});

test('returning an application restores the exact amount and exposes the reason to its owner',async t=>{
  const f=await fixture(t),user=f.client(),admin=f.client();await loginUser(user);await loginAdmin(admin);const item=(await submit(user)).body.settlement;
  assert.equal((await admin(`/api/admin/settlements/${item.id}/decision`,'POST',{action:'reject',note:'请补充微信号'})).status,200);
  const current=(await user('/api/me')).body;assert.equal(current.wallet.balance,400);assert.equal(current.wallet.settlements[0].status,'rejected');assert.equal(current.wallet.settlements[0].note,'请补充微信号');
  assert.equal((await submit(user)).status,201);
});

test('cancellation is owned by the applicant and repeated cancellation cannot duplicate balance',async t=>{
  const f=await fixture(t),user=f.client(),other=f.client();await loginUser(user);await loginUser(other,'18600001001');const item=(await submit(user)).body.settlement;
  assert.equal((await other(`/api/me/settlements/${item.id}/cancel`,'POST',{})).status,404);
  assert.equal((await user(`/api/me/settlements/${item.id}/cancel`,'POST',{})).status,200);
  assert.equal((await user(`/api/me/settlements/${item.id}/cancel`,'POST',{})).status,409);
  assert.equal((await user('/api/me')).body.wallet.balance,400);
});

test('disabling a user blocks existing sessions and new logins while preserving their records',async t=>{
  const f=await fixture(t),user=f.client(),admin=f.client();const profile=await loginUser(user);await loginAdmin(admin);
  assert.equal((await admin(`/api/admin/users/${profile.user.id}`,'PATCH',{status:'disabled',note:'演示停用'})).status,200);
  assert.equal((await user('/api/me')).status,403);
  assert.equal((await user('/api/auth/login','POST',{phone:'13800138000',password:'spartan300'})).status,403);
  const list=(await admin('/api/admin/snapshot')).body;assert.ok(list.users.some(u=>u.id===profile.user.id));
  await admin(`/api/admin/users/${profile.user.id}`,'PATCH',{status:'active'});assert.equal((await user('/api/me')).status,200);
});

test('server data persists and old financial data is imported once without later client overwrites',async t=>{
  const f=await fixture(t),user=f.client();
  const legacyHash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0).toString(16);};
  const legacy={balance:600,total:1000,recordCount:4,settlements:[{id:'old-1',amount:400,status:'pending',contact:'13800138000',date:'2026-10-26T10:00:00Z'}]};
  const first=await user('/api/auth/restore','POST',{phone:'13800138000',legacyDigest:legacyHash('spartan300'),legacy});assert.equal(first.status,200);assert.equal(first.body.wallet.balance,600);assert.equal(first.body.wallet.settlements[0].amount,400);
  assert.equal((await user('/api/auth/restore','POST',{phone:'13800138000',legacyDigest:legacyHash('spartan300'),legacy})).status,401);
  const item=first.body.wallet.settlements[0];await user(`/api/me/settlements/${item.id}/cancel`,'POST',{});
  const again=await user('/api/auth/login','POST',{phone:'13800138000',password:'spartan300',legacy:{balance:9000,total:9000}});assert.equal(again.body.wallet.balance,1000);
  const stored=JSON.parse(await readFile(f.dataPath,'utf8'));assert.equal(stored.users.find(u=>u.phone==='13800138000').balanceCents,100000);
  const restarted=await createBackend({dataPath:f.dataPath});assert.ok(restarted.handle);
});

test('stale amounts and cross-origin writes are rejected without changing the wallet',async t=>{
  const f=await fixture(t),user=f.client();await loginUser(user);
  assert.equal((await user('/api/me/settlements','POST',{contact:'13800138000',expectedAmount:200})).status,409);
  assert.equal((await user('/api/me/settlements','POST',{contact:'13800138000',expectedAmount:400},'http://unrelated.example')).status,403);
  assert.equal((await user('/api/me')).body.wallet.balance,400);
});

test('admin-created users can log in and begin with zero balance',async t=>{
  const f=await fixture(t),admin=f.client(),user=f.client();await loginAdmin(admin);
  const result=await admin('/api/admin/users','POST',{phone:'13800138123',name:'测试手艺人',skill:'榫卯',password:'demo12345'});assert.equal(result.status,201);
  const login=await user('/api/auth/login','POST',{phone:'13800138123',password:'demo12345'});assert.equal(login.status,200);assert.equal(login.body.wallet.balance,0);assert.equal(login.body.user.seedSamples,false);
  assert.equal((await submit(user)).status,409);
});
