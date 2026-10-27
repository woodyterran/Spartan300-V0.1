import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { mobileEntry } from '../mobile-entry.mjs';

const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
function desktopHarness(ua,platform='MacIntel',touch=0,search='') {
  const elements=new Map(),listeners={};
  const el=key=>{if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){}});return elements.get(key);};
  const ctx=vm.createContext({navigator:{userAgent:ua,platform,maxTouchPoints:touch},location:{search},URLSearchParams,console,Date,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:el,querySelectorAll:()=>[],documentElement:{classList:{add(){},toggle(){}}},addEventListener:(type,handler,capture)=>{(listeners[type]||=[]).push({handler,capture});}},window:{addEventListener(){},scrollTo(){}},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},URL,Blob});
  vm.runInContext(source,ctx);
  return {run:s=>vm.runInContext(s,ctx),el,listeners};
}
test('QR target uses verified Wi-Fi and carries only a whitelisted destination',()=>{
  const result=mobileEntry({wifi:{address:'192.168.31.77',verifiedWifi:true},destination:'records'});
  assert.equal(result.url,'http://192.168.31.77:3000/?continue=records');assert.equal(result.destination,'records');assert.match(result.qrSvg,/^<svg/);assert.match(result.qrSvg,/viewBox=/);assert.ok(!/script|https?:\/\//.test(result.qrSvg.replace('http://www.w3.org/2000/svg','')));
  assert.equal(mobileEntry({wifi:{address:'192.168.1.2',verifiedWifi:true},destination:'https://untrusted.example'}).destination,'advisor');
});
test('QR cannot publish a fake loopback or unverified network address',()=>{
  for(const wifi of [null,{address:'192.168.31.77',verifiedWifi:false},{address:'127.0.0.1',verifiedWifi:true},{address:'0.0.0.0',verifiedWifi:true},{address:'999.2.2.2',verifiedWifi:true}])assert.throws(()=>mobileEntry({wifi}),/Wi-Fi/);
});
test('desktop renders only the public homepage, regardless of a narrow window',()=>{
  const h=desktopHarness('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140');
  assert.equal(h.run('isDesktopBrowser()'),true);assert.match(h.el('#app').innerHTML,/desktop-home/);assert.ok(!h.el('#app').innerHTML.includes('id="auth-form"'));assert.ok(!h.el('#app').innerHTML.includes('id="chat-input"'));assert.equal(h.run('state'),undefined);
});
test('desktop controls and submissions are intercepted before business actions',()=>{
  const h=desktopHarness('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140');h.run("let handedOff='';showMobileGate=value=>{handedOff=value;}");let prevented=false,stopped=false;
  h.listeners.click.find(l=>l.capture).handler({target:{closest:()=>({dataset:{tab:'records'}})},preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
  assert.equal(h.run('handedOff'),'records');assert.equal(prevented,true);assert.equal(stopped,true);
  h.listeners.submit.find(l=>l.capture).handler({preventDefault(){},stopImmediatePropagation(){}});assert.equal(h.run('handedOff'),'login');
});
test('phones and touch iPads keep the existing mobile login flow',()=>{
  for(const [ua,platform,touch] of [['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile Safari','iPhone',5],['Mozilla/5.0 (Linux; Android 15) Chrome Mobile','Linux arm',5],['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari','MacIntel',5]]){const h=desktopHarness(ua,platform,touch);assert.equal(h.run('isDesktopBrowser()'),false);assert.match(h.el('#app').innerHTML,/id="auth-form"/);}
});
test('scanned links keep the intended mobile destination through login',()=>{
  const h=desktopHarness('iPhone Mobile','iPhone',5,'?continue=records');assert.equal(h.run('tab'),'records');assert.match(h.el('#app').innerHTML,/id="auth-form"/);
  const register=desktopHarness('Android Mobile','Linux arm',5,'?continue=register');assert.equal(register.run('authMode'),'register');
});
