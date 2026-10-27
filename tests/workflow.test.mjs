import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
function harness() {
  const storage=new Map(),elements=new Map(),listeners={},intervals=[];
  const el=selector=> { if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',checked:false,disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},scrollIntoView(){},parentElement:{lastChild:{textContent:''}},focus(){}});return elements.get(selector); };
  const context=vm.createContext({console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:el,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn,visibilityState:'visible'},window:{addEventListener(){},scrollTo(){}},navigator:{onLine:true},setTimeout:fn=>{fn();return 1;},clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},requestAnimationFrame(){},innerWidth:844,innerHeight:390,URL,Blob,Date,FormData:class{constructor(f){this.data=f.fields;}get(k){return this.data[k] ?? '';}}});
  const run=code=>vm.runInContext(code,context);
  run(source);
  run("phone='13800138000';load();render=()=>{};showRecord=()=>{};");
  const click=async dataset=>listeners.click({target:{closest:()=>({dataset,disabled:false})}});
  const submit=fields=>listeners.submit({preventDefault(){},target:{id:'settle-form',fields}});
  return {run,el,click,submit,storage,intervals};
}

test('three answers open a six-hour window that survives retakes and refresh',async()=>{
  const h=harness();
  h.run('openShoot()'); assert.equal(h.run('media'),null);
  await h.run("send('专业厨艺：手工拆骨和精细刀工工序')"); assert.equal(h.run('state.permit'),null);
  await h.run("send('已授权的专业厨房，能拍清双手和工件')"); assert.equal(h.run('state.permit'),null);
  await h.run("send('刀具、砧板，手机头戴支架，可以边操作边讲解录音')"); assert.ok(h.run('state.permit.id'));
  h.run('openShoot();startRecording()'); assert.equal(h.run('media.recording'),false); assert.ok(h.run('state.permit'));
  h.el('#mic-confirm').checked=true;h.el('#landscape-confirm').checked=true;
  const expires=h.run('state.permit.expiresAt');h.run('startRecording()');assert.equal(h.run('media.recording'),true);assert.ok(h.run('state.permit'));
  h.run('load()');assert.equal(h.run('state.permit.expiresAt'),expires);assert.equal(h.run('state.records[0].status'),'interrupted');
});

test('unsafe or silent brief fails evaluation and grants no permit',async()=>{
  const h=harness();for(const s of ['我想拍景色','安全开放公园','没有麦克风，不能录音'])await h.run(`send(${JSON.stringify(s)})`);
  assert.equal(h.run('state.permit'),null);assert.match(h.run('state.messages.at(-1).text'),/未通过/);
});

test('offline simulation saves pending chunks; retry waits for review without crediting income',async()=>{
  const h=harness();h.run("claimBounty('测试拍摄',[]);openShoot()");
  h.el('#mic-confirm').checked=true;h.el('#landscape-confirm').checked=true;
  h.run('media.offline=true;startRecording();media.start=Date.now()-12000');
  await h.run('finishRecording()'); await Promise.resolve();
  assert.equal(h.run('state.records[0].status'),'draft');assert.equal(h.run('state.records[0].chunks'),3);
  const draftId=h.run('state.records[0].id');await h.run(`uploadRecord(${JSON.stringify(draftId)})`);assert.equal(h.run('state.records[0].status'),'cached');
  const id=h.run('state.records[0].id');await h.click({retry:id});assert.equal(h.run('state.records[0].status'),'review');
  await h.click({approve:id});await h.click({approve:id});assert.equal(h.run('state.records[0].status'),'review');assert.equal(h.run('state.balance'),400);assert.equal(h.run('state.records[0].amount'),0);
  assert.equal(h.run('state.permit'),null);
});

test('recording timer stops at 30 minutes',async()=>{
  const h=harness();h.run("claimBounty('测试',[]);openShoot()");h.el('#mic-confirm').checked=true;h.el('#landscape-confirm').checked=true;
  h.run('startRecording();media.start=Date.now()-1801000');h.intervals[0]();await Promise.resolve();await Promise.resolve();
  assert.equal(h.run('state.records[0].duration'),1800);assert.equal(h.run('media'),null);
});

test('settlement always requests full balance and duplicate submits or cancellations do not duplicate funds',async()=>{
  const h=harness();const fields={contact:'13800138000',wechat:'demo-only'};
  h.submit(fields);h.submit(fields);assert.equal(h.run('state.balance'),0);assert.equal(h.run('state.settlements.length'),1);assert.equal(h.run('state.settlements[0].amount'),400);
  const id=h.run('state.settlements[0].id');await h.click({cancelSettle:id});await h.click({cancelSettle:id});assert.equal(h.run('state.balance'),400);
});

test('real recording cannot start without available camera and microphone',()=>{
  const h=harness();h.run("claimBounty('测试',[]);openShoot();media.mode='real'");h.el('#mic-confirm').checked=true;h.el('#landscape-confirm').checked=true;
  h.run('startRecording()');assert.equal(h.run('media.recording'),false);assert.ok(h.run('state.permit'));
});


test('landscape content is outside expert manual skill collection and grants no permit',async()=>{
  const h=harness();for(const s of ['想拍公园风景','公园傍晚','手机三脚架，可以录音'])await h.run(`send(${JSON.stringify(s)})`);
  assert.equal(h.run('state.permit'),null);assert.match(h.run('state.messages.at(-1).text'),/机器人训练采集方向/);
});

test('duplicate skill simulation refuses a new bounty authorization',async()=>{
  const h=harness();for(const s of ['手工拆骨工序','系统已收录，重复工序','手机头戴支架，可以录音'])await h.run(`send(${JSON.stringify(s)})`);
  assert.equal(h.run('state.permit'),null);assert.match(h.run('state.messages.at(-1).text'),/模拟查重未通过/);
});


test('earlier generic demo is backed up and migrated without losing account or custom records',()=>{
  const h=harness();h.run("state={...seed(),contentVersion:undefined,balance:286,total:286,messages:[{role:'user',text:'城市街景'}],permit:{id:'old'},brief:['街景']};state.records[1].amount=158;state.records[2].amount=128;state.records.push({id:'custom',title:'早期测试',amount:0,status:'local'});save();load()");
  assert.equal(h.run('state.balance'),400);assert.equal(h.run('state.messages.length'),0);assert.equal(h.run('state.permit'),null);assert.equal(h.run('state.records.at(-1).id'),'custom');
  assert.equal(h.run('read(`s300-before-expert-${phone}`,null).balance'),286);
});

test('finishing does not upload; discarding keeps the same window for a retake',async()=>{
  const h=harness();h.run("claimBounty('专业皮具缝制',[]);openShoot()");const expires=h.run('state.permit.expiresAt'),claimId=h.run('state.permit.id');h.el('#mic-confirm').checked=true;h.el('#landscape-confirm').checked=true;
  await h.run('startRecording()');await h.run('finishRecording()');await Promise.resolve();assert.equal(h.run('state.records[0].status'),'draft');assert.equal(h.run('state.permit.id'),claimId);
  const id=h.run('state.records[0].id');await h.click({discardRecord:id});assert.equal(h.run('state.records[0].status'),'discarded');assert.equal(h.run('state.permit.expiresAt'),expires);
  await h.run(`resumeBounty(${JSON.stringify(claimId)})`);assert.ok(h.run('media'));assert.equal(h.run('media.permitId'),claimId);assert.equal(h.run('state.permit.expiresAt'),expires);
});

test('an expired window blocks starting and uploading a saved draft',async()=>{
  const h=harness();h.run("claimBounty('测试手艺',[]);state.permit.expiresAt=new Date(Date.now()-1).toISOString();openShoot()");assert.equal(h.run('media'),null);
  h.run("state.records.unshift({id:'expired-draft',claimId:state.permit.id,status:'draft',simulated:true,duration:10,chunks:2});");await h.run("uploadRecord('expired-draft')");assert.equal(h.run('state.records[0].status'),'draft');
});
