const $ = (s, p = document) => p.querySelector(s);
const icons = {
  spark: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6Z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 11 11 0 0 1-4-.8L3 21l1.7-5a8.3 8.3 0 0 1-1.7-5A8.7 8.7 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/><path d="M8 11h8m-8 4h5"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  camera: '<path d="m8 6 2-3h4l2 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"/><circle cx="12" cy="12" r="4"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 4-6 5 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
  wifi: '<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01"/>',
  rotate: '<path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6m-4 9a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/>',
  wallet: '<path d="M20 7V4H5a3 3 0 0 0 0 6h16v10H5a3 3 0 0 1-3-3V7m19 7h-5v3h5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const craftCopy = value => String(value ?? '')
  .replaceAll('每一道工序', '每一种手艺')
  .replaceAll('一道完整的专业手工工序', '一种专业手艺的完整操作')
  .replaceAll('一道完整工序', '一种手艺的完整操作')
  .replaceAll('一道拿手工序', '一种拿手的手艺')
  .replaceAll('一道工序', '一种手艺')
  .replaceAll('这道工序', '这种手艺')
  .replaceAll('完整工序', '完整操作过程')
  .replaceAll('高技能手工工序', '高技能手艺')
  .replaceAll('高技能工序', '高技能手艺')
  .replaceAll('拿手工序', '拿手的手艺')
  .replaceAll('工序', '手艺')
  .replaceAll('换一道你擅长的', '换一种你擅长的')
  .replaceAll('哪一道', '哪一种');
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const hash = s => { let n = 2166136261; for (const c of s) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0).toString(16); };
const money = n => Number(n).toFixed(2);
const time = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
let storageOK = true;
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { storageOK = false; return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { storageOK = false; toast('浏览器存储不可用，刷新后数据可能丢失'); } }
let accounts = read('s300-accounts', { '13800138000': hash('spartan300') });
let phone = read('s300-session', '');
let state, tab = 'advisor', authMode = 'login', filter = '全部', busy = false, media = null;
const USE_SERVER = typeof fetch === 'function';
let serverConnected = false, serverProfile = null, accountEpoch = 0, walletRefreshing = false;
const BOUNTY_WINDOW_MS = 6 * 60 * 60 * 1000;
let bountyClockOffset = 0, bountyRefreshing = false, bountySnapshot = null;
const bountyNow = () => Date.now() + bountyClockOffset;
const claimActive = claim => Boolean(claim && claim.status === 'active' && Date.parse(claim.expiresAt) > bountyNow());
const claimForRecord = record => (state.bountyClaims || []).find(c => c.id === record.claimId) || (state.permit?.id === record.claimId ? state.permit : null);
const windowRemaining = claim => { const seconds=Math.max(0,Math.ceil((Date.parse(claim.expiresAt)-bountyNow())/1000));return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${time(seconds%3600)}`; };
const windowNotice = claim => `<div class="bounty-window">${icon('clock')}<div><b>6 小时独占窗口</b><span data-bounty-countdown="${esc(claim.id)}">${windowRemaining(claim)}</span><p>放弃后可重拍，期限不重置。到期未提交或判失败，任务向所有用户释放。</p></div></div>`;
function applyBounties(result) {
  bountyClockOffset=result.serverNow-Date.now();bountySnapshot=result;
  state.bountyClaims=result.claims;
  const previous=state.permit;
  const selected=result.claims.find(c=>c.id===previous?.id && claimActive(c)) || (!state.consultingNew && !previous ? result.claims.find(claimActive) : null);
  state.permit=selected || null;
  if(selected)state.consultApproved=true;
  for(const record of state.records){const claim=claimForRecord(record);if(!claim)continue;if(claim.status==='submitted' && ['draft','cached'].includes(record.status) && claim.submission?.recordId===record.id)record.status='review';if(['failed','approved'].includes(claim.status) && record.status==='review'){record.status=claim.status==='failed'?'failed':'accepted';record.reviewNote=claim.reviewNote;}}
  save();
}
async function refreshBounties(paint=true) {
  if(!USE_SERVER || !phone || bountyRefreshing)return;
  const number=phone,epoch=accountEpoch;bountyRefreshing=true;
  try {
    const result=await accountApi('/api/me/bounties');if(number!==phone || epoch!==accountEpoch)return;
    const changed=JSON.stringify(state.bountyClaims || [])!==JSON.stringify(result.claims) || JSON.stringify(bountySnapshot?.bounties)!==JSON.stringify(result.bounties);
    applyBounties(result);if(changed && paint && !media && !$('#overlay').innerHTML)render();
  }catch(error){if(error.status===401 || error.status===403)serverConnected=false;}
  finally{bountyRefreshing=false;}
}
async function claimBounty(title,brief) {
  if(USE_SERVER){const result=await accountApi('/api/me/bounties/claim',{method:'POST',body:{title,bountyId:state.selectedBountyId || undefined,brief}});applyBounties(result);const task=result.bounties.find(t=>t.mine && (state.selectedBountyId?t.id===state.selectedBountyId:t.title.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'')===title.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'')));state.permit=result.claims.find(c=>c.bountyId===task?.id && claimActive(c));}
  else {state.permit={id:uid(),bountyId:uid(),title,brief:[...brief],status:'active',claimedAt:new Date(bountyNow()).toISOString(),expiresAt:new Date(bountyNow()+BOUNTY_WINDOW_MS).toISOString()};state.bountyClaims ||= [];state.bountyClaims.push(state.permit);}
  if(!state.permit)throw Error('未能领取悬赏，请刷新后重试');
  state.consultingNew=false;state.consultApproved=true;save();
}
function taskPool() {
  const mine=(state.bountyClaims || []).filter(claimActive),available=(bountySnapshot?.bounties || []).filter(t=>t.status==='open');
  if(!mine.length && !available.length)return '';
  return `<details class="bounty-pool"><summary>${icon('clock')} 我的独占任务 ${mine.length} · 可领取悬赏 ${available.length}</summary><div>${mine.map(c=>`<article><div><b>${esc(c.title)}</b><small>独占剩余 <span data-bounty-countdown="${esc(c.id)}">${windowRemaining(c)}</span></small></div><button data-resume-bounty="${esc(c.id)}">继续拍摄</button></article>`).join('')}${available.map(t=>`<article><div><b>${esc(t.title)}</b><small>已释放 · 所有人可重新评估领取</small></div><button data-pick-bounty="${esc(t.id)}">咨询领取</button></article>`).join('')}</div></details>`;
}
function resumeBounty(id) {
  const claim=(state.bountyClaims || []).find(c=>c.id===id);if(!claimActive(claim))return toast('独占窗口已结束，请重新咨询领取');
  state.permit=claim;state.consultingNew=false;state.consultApproved=true;save();closeModal();tab='advisor';render();openShoot();
}
function pickBounty(id) {
  const task=bountySnapshot?.bounties.find(t=>t.id===id && t.status==='open');if(!task)return;
  state.selectedBountyId=task.id;state.consultingNew=true;state.permit=null;state.consultApproved=false;state.messages=[];state.brief=[task.title];
  addMessage('user',task.title);addMessage('assistant','这项悬赏已重新开放。你准备在哪个工作场景操作？请说明操作台、光线，以及是否能完整拍到双手、工具和工件。');tab='advisor';save();render();
}
async function uploadRecord(id) {
  const record=state.records.find(r=>r.id===id);if(!record || !['draft','cached'].includes(record.status) || record.uploading)return;
  const claim=claimForRecord(record);if(!claimActive(claim)){toast('独占窗口已结束或悬赏已失效，无法提交这次拍摄');await refreshBounties(false);return;}
  if(record.simulated && (record.uploadOffline || !navigator.onLine)){record.status='cached';record.queued=record.chunks;save();showRecord(id);return toast('已选择模拟上传，当前模拟断网；窗口内恢复后可补传');}
  record.uploading=true;
  try {
    if(USE_SERVER){applyBounties(await accountApi(`/api/me/bounties/${encodeURIComponent(claim.id)}/submit`,{method:'POST',body:{recordId:record.id,duration:record.duration,chunks:record.chunks,simulated:record.simulated}}));}
    else {claim.status='submitted';claim.submission={recordId:record.id};if(state.permit?.id===claim.id)state.permit=null;}
    record.status='review';record.queued=0;save();render();showRecord(id);toast('模拟提交成功，请等待审核结果；没有发送视频文件');
  }catch(error){toast(error.message);await refreshBounties(false);}
  finally{delete record.uploading;save();}
}
function discardRecord(id) {
  const record=state.records.find(r=>r.id===id);if(!record || !['draft','cached','interrupted','local'].includes(record.status) || record.uploading)return;
  record.status='discarded';record.queued=0;const claim=claimForRecord(record);save();render();
  modal('本次拍摄已放弃',`<div class="sheet-body"><h3>可以在窗口内重新拍摄</h3><p>本次视频不会提交，已保留的本地文件可在记录中导出。放弃不会释放独占权，也不会重置 6 小时期限。</p>${claimActive(claim)?`${windowNotice(claim)}<button class="primary wide" data-resume-bounty="${esc(claim.id)}">重新拍摄 ${icon('rotate')}</button>`:'<p class="notice">当前独占窗口已结束或任务已失效，请重新咨询领取。</p>'}<button class="secondary wide" data-action="return-advisor">返回拍摄顾问</button></div>`);
}
function tickBountyWindows() {
  if(!phone || !state)return;
  document.querySelectorAll('[data-bounty-countdown]').forEach(element=>{const claim=(state.bountyClaims || []).find(c=>c.id===element.dataset.bountyCountdown);if(claim)element.textContent=claimActive(claim)?windowRemaining(claim):'窗口已结束';});
  if(state.permit && !claimActive(state.permit)){state.permit=null;save();if(!media && !$('#overlay').innerHTML)render();}
}

const mobileDestinations = new Set(['advisor','records','profile','login','register','shoot']);
const requestedMobileDestination = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('continue') : null;
let mobileGateRequest = 0;
function isDesktopBrowser() {
  const ua=navigator.userAgent || '';
  // Device identity, rather than viewport width: a narrow desktop window is still desktop.
  if(!ua)return false;
  return !(navigator.userAgentData?.mobile || /iPhone|iPad|iPod|Android|Windows Phone|Mobile/i.test(ua) || navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}
function renderDesktopHome() {
  document.documentElement.classList.add('desktop-browser');
  $('#app').innerHTML=`<div class="desktop-home"><header class="desktop-header"><button class="home-brand" data-desktop-home aria-label="Spartan300 首页">${brand()}</button><nav aria-label="首页导航"><button data-desktop-home class="home-current">首页</button><button data-mobile-destination="advisor">AI 拍摄顾问</button><button data-mobile-destination="records">拍摄记录</button><button data-mobile-destination="profile">我的</button></nav><button class="desktop-login" data-mobile-destination="login">登录 / 注册 ${icon('arrow')}</button></header><main><section class="desktop-hero"><div class="desktop-hero-copy"><span class="eyebrow">DEEPREACH · 手艺悬赏计划</span><h1>你多年练成的，<br><em>正是值得记录的。</em></h1><p>把拿手的手艺完整拍下来，<br>为机器人训练，留下真实的手上经验。</p><div class="desktop-hero-actions"><button class="primary" data-mobile-destination="advisor">开始记录手艺 ${icon('arrow')}</button><span>${icon('camera')} 使用手机，记录真实操作</span></div><div class="desktop-hero-facts"><div><b>6 小时</b><span>悬赏独占窗口</span></div><div><b>1080P</b><span>横屏有声采集</span></div><div><b>30 分钟</b><span>单条视频最长时长</span></div></div></div><div class="desktop-hero-image"><img src="/assets/expert-hero-wide.jpg" alt="专家佩戴头戴设备展示专业刀工与双手操作的第一视角示例"><span class="desktop-image-label">EXPERT SKILLS. REAL-WORLD DATA.</span></div></section><section class="desktop-intro"><div><span class="eyebrow">从专业经验，到训练数据</span><h2>把手上的经验，清楚地留下来。</h2></div><p>让双手、工具和工件持续入镜，<br>记录完整操作，也讲清关键判断。</p></section><section class="desktop-feature-grid" aria-label="采集流程"><button data-mobile-destination="advisor"><span class="desktop-step-icon">${icon('spark')}</span><small>01 / 拍摄前</small><h3>和顾问说说拿手的手艺</h3><p>说明操作内容、工作场景和工具，获得拍摄指导与悬赏机会评估。</p><span class="desktop-feature-link">手机扫码咨询 ${icon('arrow')}</span></button><button data-mobile-destination="shoot"><span class="desktop-step-icon">${icon('camera')}</span><small>02 / 采集时</small><h3>从准备到完成，完整记录</h3><p>领取后独占 6 小时，窗口内可放弃重拍，满意后再选择上传。</p><span class="desktop-feature-link">手机扫码开始 ${icon('arrow')}</span></button><button data-mobile-destination="profile"><span class="desktop-step-icon">${icon('wallet')}</span><small>03 / 提交后</small><h3>跟进审核，查看手艺回报</h3><p>在手机上查看拍摄记录和结算状态，申请后由管理员线下联系。</p><span class="desktop-feature-link">手机扫码查看 ${icon('arrow')}</span></button></section></main><footer class="desktop-footer"><span>Spartan300 · V0.1 简易采集版</span><span>本地原型 · AI 评估、视频上传、审核与收益为模拟</span></footer></div>`;
}
async function showMobileGate(destination='advisor') {
  if(!isDesktopBrowser())return;
  const target=mobileDestinations.has(destination)?destination:'advisor',request=++mobileGateRequest;
  modal('请用手机扫码继续',`<div class="sheet-body mobile-gate-body" id="mobile-gate-body"><div class="mobile-gate-symbol">${icon('camera')}</div><h3>把专业经验，拍进手机里。</h3><p>采集功能仅在手机上使用。<br>请用手机相机扫描二维码继续。</p><div class="mobile-qr-loading" role="status">正在生成手机访问二维码…</div></div>`,'mobile-gate');
  try {
    const response=await fetch(`/api/mobile-entry?destination=${encodeURIComponent(target)}`,{cache:'no-store'}),result=await response.json();
    if(!response.ok)throw Error(result.error || '二维码暂时无法生成');
    if(request!==mobileGateRequest || !$('#mobile-gate-body'))return;
    $('#mobile-gate-body').innerHTML=`<span class="eyebrow">SPARTAN300 · 在手机上继续</span><h3>请用手机扫码继续</h3><p>此功能仅在手机上使用，<br>请用手机相机扫描下方二维码。</p><div class="mobile-qr" role="img" aria-label="手机继续使用二维码">${result.qrSvg}</div><p class="mobile-network-note">${result.localNetwork ? '手机与 Mac 需连接同一个 Wi-Fi' : '云端私有预览：请在手机浏览器登录同一 GitHub 账号'}</p><p class="mobile-target-url">${esc(result.url)}</p><div class="mobile-handoff-note">扫码后进入对应功能；未登录时请先登录。<br>真实摄像头录制仍需要可信 HTTPS，局域网 HTTP 可体验模拟流程。</div><button class="primary wide" data-desktop-home>返回首页</button><button class="text-button wide" data-mobile-retry="${target}">刷新二维码</button>`;
  }catch(error){if(request!==mobileGateRequest || !$('#mobile-gate-body'))return;$('#mobile-gate-body').innerHTML=`<h3>暂时无法生成二维码</h3><p>${esc(error.message)}</p><button class="primary wide" data-mobile-retry="${target}">重新获取访问地址</button><button class="text-button wide" data-desktop-home>返回首页</button>`;}
}
function desktopInteractionGate(event) {
  if(!isDesktopBrowser())return;
  const element=event.target.closest('button,a,input,textarea,select,[data-tab]');if(!element)return;
  if(element.dataset.desktopHome!==undefined){event.preventDefault();event.stopImmediatePropagation();closeModal();window.scrollTo(0,0);return;}
  if(element.dataset.action==='close')return;
  event.preventDefault();event.stopImmediatePropagation();
  showMobileGate(element.dataset.mobileRetry || element.dataset.mobileDestination || element.dataset.tab || (element.dataset.action==='auth-register'?'register':'advisor'));
}

function seed() { return { contentVersion: 3, balance: 400, total: 400, settlements: [], brief: [], permit: null, consultApproved: false, messages: [], records: [
  { id: 'sample-3', title: '电气装配 · 连接器接线与检查', cover: 'electrical', date: '演示样例', duration: 42, status: 'review', amount: 0, simulated: true, chunks: 9 },
  { id: 'sample-2', title: '木工装配 · 铰链定位与精调', cover: 'assembly', date: '演示样例', duration: 76, status: 'approved', amount: 200, simulated: true, chunks: 16 },
  { id: 'sample-1', title: '专业厨艺 · 手工拆骨与精细刀工', cover: 'cooking', date: '演示样例', duration: 58, status: 'approved', amount: 200, simulated: true, chunks: 12 },
] }; }
function save() { if (phone) write(`s300-data-${phone}`, state); }
function load() {
  state = read(`s300-data-${phone}`, null) || seed();
  if(state.contentVersion !== 3) {
    // Preserve the earlier prototype snapshot before replacing its generic sample content.
    if(!read(`s300-before-expert-${phone}`,null)) write(`s300-before-expert-${phone}`, state);
    const samples = seed().records;
    for(const r of state.records) {
      const sample = samples.find(x=>x.id===r.id);
      if(sample) {r.title=sample.title;r.cover=sample.cover;if(r.status==='approved'){const delta=200-r.amount;r.amount=200;state.balance+=delta;state.total+=delta;}}
      else if(/街景|风景|天际线|公园|蓝调时刻/.test(r.title)) r.title='早期界面测试记录（非手艺采集）';
    }
    if(state.messages.some(m=>/街景|风景|公园|创作者|光线柔和/.test(m.text))) {state.messages=[];state.brief=[];state.permit=null;}
    state.contentVersion=3;save();
  }
  if(state.consultApproved === undefined) {
    state.consultApproved = Boolean(state.permit || state.messages.some(m => m.role === 'assistant' && /模拟查重与复杂度评估已通过|模拟外部悬赏评估已完成/.test(m.text)));
    save();
  }
  state.records.forEach(record=>delete record.uploading);
  if(state.activeRecording) {
    const r=state.activeRecording;
    if(!state.records.some(x=>x.id===r.id)) state.records.unshift({...r,status:'interrupted',amount:0,date:'页面中断 · 本地恢复'});
    delete state.activeRecording; save();
  }
}
async function accountApi(url, options = {}) {
  let response;
  try { response = await fetch(url, { credentials:'same-origin', ...options, headers:{'Content-Type':'application/json'}, body:options.body === undefined ? undefined : JSON.stringify(options.body) }); }
  catch { throw new Error('无法连接本机结算服务，请确认 Mac 与开发服务器仍在运行'); }
  const result = await response.json();
  if(!response.ok){const error=new Error(result.error || '操作失败，请稍后重试');error.status=response.status;throw error;}
  return result;
}
function legacyAccountData(number) {
  const cached=read(`s300-data-${number}`,null);
  if(!cached)return undefined;
  if(!read(`s300-before-server-${number}`,null))write(`s300-before-server-${number}`,cached);
  return {balance:cached.balance,total:cached.total,settlements:cached.settlements || [],recordCount:cached.records?.length || 0};
}
function applyServerAccount(result, initial = false) {
  const existing=read(`s300-data-${phone}`,null);
  if(initial){load();if(!existing && !result.user.seedSamples)state.records=[];}
  serverProfile=result.user;serverConnected=true;
  state.balance=result.wallet.balance;state.total=result.wallet.total;state.settlements=result.wallet.settlements;
  save();
}
async function connectAccount() {
  if(!USE_SERVER || !phone)return;
  const number=phone,epoch=++accountEpoch;
  try {
    let result;
    try {result=await accountApi('/api/me');}
    catch(error){
      if(error.status!==401)throw error;
      result=await accountApi('/api/auth/restore',{method:'POST',body:{phone:number,legacyDigest:accounts[number],legacy:legacyAccountData(number)}});
    }
    if(epoch!==accountEpoch || number!==phone)return;
    if(result.user.phone!==number){phone=result.user.phone;accounts[phone] ||= 'server-session';write('s300-session',phone);write('s300-accounts',accounts);}
    applyServerAccount(result,true);await refreshBounties(false);render();
  }catch(error){
    if(epoch!==accountEpoch || number!==phone)return;
    serverConnected=false;
    if(error.status===401 || error.status===403){phone='';write('s300-session','');render();$('#auth-error').textContent=error.status===403?error.message:'本机服务已更新，请重新登录一次';}
  }
}
async function authenticateWithServer(form, data) {
  const number=String(data.get('phone') || '').trim(),password=String(data.get('password') || ''),error=$('#auth-error'),button=$('button[type="submit"]',form);
  if(!/^1[3-9]\d{9}$/.test(number)){error.textContent='请输入有效的 11 位手机号码';return;}
  if(password.length<6){error.textContent='演示密码至少需要 6 位';return;}
  if(button.disabled)return;button.disabled=true;error.textContent='';
  const epoch=++accountEpoch;
  try {
    const result=await accountApi(authMode==='register'?'/api/auth/register':'/api/auth/login',{method:'POST',body:{phone:number,password,legacy:authMode==='login'?legacyAccountData(number):undefined}});
    if(epoch!==accountEpoch)return;
    phone=number;accounts[phone]=hash(password);write('s300-accounts',accounts);write('s300-session',phone);
    applyServerAccount(result,true);await refreshBounties(false);render();
  }catch(err){error.textContent=err.message;}
  finally{if(button.isConnected)button.disabled=false;}
}
async function refreshAccount() {
  if(!USE_SERVER || !phone || walletRefreshing || media || $('#overlay').innerHTML || document.visibilityState==='hidden')return;
  const number=phone,epoch=accountEpoch;walletRefreshing=true;
  try {
    const result=await accountApi('/api/me');
    if(number!==phone || epoch!==accountEpoch)return;
    const changed=serverProfile?.name!==result.user.name || JSON.stringify({balance:state.balance,total:state.total,settlements:state.settlements})!==JSON.stringify({balance:result.wallet.balance,total:result.wallet.total,settlements:result.wallet.settlements});
    applyServerAccount(result);if(changed && tab==='profile')render();
  }catch(error){
    if(epoch!==accountEpoch || number!==phone)return;
    if(error.status===401 || error.status===403){serverConnected=false;phone='';accountEpoch++;write('s300-session','');render();$('#auth-error').textContent=error.status===403?error.message:'登录已失效，请重新登录';}
    else serverConnected=false;
  }finally{walletRefreshing=false;}
}
async function submitServerSettlement(form,data) {
  const button=$('button[type="submit"]',form);if(button.disabled)return;button.disabled=true;
  try {
    const result=await accountApi('/api/me/settlements',{method:'POST',body:{contact:data.get('contact'),wechat:data.get('wechat'),expectedAmount:state.balance}});
    applyServerAccount(result);closeModal();render();toast('申请已提交到本机结算后台，请等待管理员处理');
  }catch(error){toast(error.message);if(error.status===409){closeModal();await refreshAccount();render();}}
  finally{if(button.isConnected)button.disabled=false;}
}
async function cancelServerSettlement(id) {
  try {const result=await accountApi(`/api/me/settlements/${encodeURIComponent(id)}/cancel`,{method:'POST',body:{}});applyServerAccount(result);render();toast('结算申请已撤销，演示余额已恢复');}
  catch(error){toast(error.message);await refreshAccount();}
}
const settlementStatusText = item => ({pending:'等待管理员线下联系（演示）',paid:'后台已登记线下付款（演示）',cancelled:'已撤销',rejected:'已退回，余额已恢复'}[item.status] || '待确认');
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 3600); }
function modal(title, body, cls = '') { $('#overlay').innerHTML = `<div class="scrim"><section class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-button" data-action="close" aria-label="关闭">${icon('close')}</button></div>${body}</section></div>`; setTimeout(() => $('#overlay input, #overlay button')?.focus(), 30); }
function closeModal() { mobileGateRequest++; $('#overlay').innerHTML = ''; }
function brand() { return `<div class="brand"><img src="/assets/deepreach-logo.png" alt="DeepReach" width="104" height="55"><span class="brand-sub">手艺悬赏计划<small>Spartan300 · 简易采集</small></span></div>`; }
function renderAuth() {
  $('#app').innerHTML = `<div class="auth-layout"><section class="auth-story">${brand()}<div class="story-content"><span class="eyebrow">EXPERT SKILLS. REAL-WORLD DATA.</span><h1>你多年练成的，<br>值得被记录<span>。</span></h1><p>把拿手的手艺完整拍下来，<br>为机器人训练，留下真实的手上经验。</p><div class="story-foot"><span class="line"></span> 记录专家经验 · 让机器人理解真实操作</div></div><div class="story-coordinate">EXPERT DEMONSTRATIONS <span>SPARTAN300 / V0.1</span></div></section><section class="auth-panel"><div class="auth-mobile-brand">${brand()}</div><div class="auth-card"><span class="eyebrow accent">DEEPREACH · 手艺悬赏计划</span><h2>${authMode === 'login' ? '欢迎回来' : '开始记录手艺'}<span class="lime-dot"></span></h2><p class="muted">${authMode === 'login' ? '登录，准备记录你的拿手的手艺' : '注册连接本机服务的演示账号'}</p><div class="auth-tabs"><button data-action="auth-login" class="${authMode === 'login' ? 'active' : ''}">手机号登录</button><button data-action="auth-register" class="${authMode === 'register' ? 'active' : ''}">注册账号</button></div><form id="auth-form"><label>手机号码<div class="phone-field"><span>+86</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" placeholder="请输入手机号码" required value="${authMode === 'login' ? '13800138000' : ''}"></div></label><label>密码<input name="password" type="password" autocomplete="${authMode === 'login' ? 'current-password' : 'new-password'}" minlength="6" maxlength="64" placeholder="至少 6 位，仅使用演示密码" value="${authMode === 'login' ? 'spartan300' : ''}" required></label><p id="auth-error" class="form-error" role="alert"></p><button class="primary wide" type="submit">${authMode === 'login' ? '进入手艺采集工作台' : '创建演示账号'} ${icon('arrow')}</button></form><div class="demo-credentials">${icon('info')}<div>演示账号 13800138000<br><span>密码 spartan300 · 已为你填好</span></div></div><p class="auth-note">V0.1 本地原型 · 账号连接本机演示服务<br>请勿使用真实密码，评估与收益均为演示数据。</p></div><span class="auth-footer">SPARTAN300 © 2026 <b>V0.1 PROTOTYPE</b></span></section></div>`;
}
const statuses = { draft:['待确认上传','blue'], discarded:['已放弃','amber'], failed:['模拟审核失败','amber'], accepted:['模拟审核通过','green'], review: ['模拟审核中', 'amber'], approved: ['模拟已采纳', 'green'], cached: ['模拟待补传', 'amber'], local: ['本地已保存', 'blue'], interrupted: ['录制已中断', 'amber'] };
function header() { return `<header class="topbar">${brand()}<div class="header-right"><span class="prototype-label">V0.1 <span>本地原型</span></span><button class="avatar" data-action="profile" aria-label="我的账户">${phone.slice(-2)}</button></div></header>`; }
function syncChatFocus(forceOff = false) {
  const root = document.documentElement;
  if (!root) return;
  const editing = !forceOff && document.activeElement?.id === 'chat-input';
  root.classList.toggle('chat-input-active', editing);
}
function render() {
  syncChatFocus(true);
  if(isDesktopBrowser()){renderDesktopHome();return;}
  if (!phone || !accounts[phone]) { renderAuth(); return; }
  $('#app').innerHTML = `<div class="workspace">${header()}<main class="main ${tab === 'advisor' ? `advisor-main ${state.consultApproved || state.permit ? 'advisor-ready' : ''}` : ''}">${tab === 'advisor' ? advisor() : tab === 'records' ? records() : profile()}</main><nav class="bottom-nav" aria-label="主导航">${[['advisor','spark','AI 拍摄顾问'],['records','film','拍摄记录'],['profile','user','我的']].map(([id,ic,label]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" ${tab === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span>${tab === id ? '<i></i>' : ''}</button>`).join('')}</nav></div>`;
  if (tab === 'advisor' && state.messages.length) requestAnimationFrame(() => $('#conversation-end')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
}
function advisor() {
  const has = state.messages.length > 0;
  return `<div class="page-heading"><div><span class="eyebrow">专家操作采集 · 用于机器人训练</span><h1>AI 拍摄顾问</h1></div><div class="heading-actions">${has ? `<button class="new-consult" data-action="new-consult">${icon('rotate')} 换一种手艺</button>` : ''}<button class="round-help" data-action="about" aria-label="原型说明">${icon('info')}</button></div></div>
  <div class="advisor-layout"><section class="advisor-content">
    <section class="hero ${has ? 'compact' : ''}"><div class="hero-copy"><span class="live-tag">手艺悬赏计划</span><h2>你多年练成的，<br><em>正是值得记录的。</em></h2><p>拍下一种拿手的手艺，<br>让机器人学习真实的专业经验。</p><span class="hero-location">${icon('camera')} 专家操作 · 第一视角</span></div><div class="hero-photo"><picture><source media="(max-width:720px)" srcset="/assets/expert-hero-wide.jpg"><img src="/assets/expert-chef.jpg" alt="V1 专家操作示例：厨师佩戴手机支架进行刀工操作，右下角为双手与工具的第一视角"></picture><span>V1 专家采集示例图</span></div></section>
    <div class="capture-principles"><span>${icon('user')} 双手与工具入镜</span><span>${icon('film')} 完整操作过程</span><span>${icon('mic')} 边做边讲解</span></div>
    <div class="conversation"><div class="assistant-message"><span class="ai-avatar">${icon('spark')}</span><div class="message-content"><div class="message-author">AI 拍摄顾问 <span>模拟对话</span></div><div class="bubble">师傅，你好。<br>想记录哪一种<b>最拿手的手艺</b>？告诉我操作内容、工作场景和拍摄工具，我会模拟评估悬赏机会，帮你把双手操作和关键判断拍清楚。</div></div></div>
    ${state.messages.map(m => `<div class="${m.role === 'user' ? 'user-message' : 'assistant-message'}">${m.role !== 'user' ? `<span class="ai-avatar">${icon('spark')}</span>` : ''}<div class="message-content">${m.role !== 'user' ? '<div class="message-author">AI 拍摄顾问 <span>模拟对话</span></div>' : ''}<div class="bubble">${m.image ? `<img class="chat-photo" src="${esc(m.image)}" alt="手艺咨询参考图片">` : ''}${esc(craftCopy(m.text)).replace(/\n/g,'<br>')}</div></div></div>`).join('')}
    ${busy ? '<div class="typing"><i></i><i></i><i></i><span>正在模拟分析手艺…</span></div>' : ''}${state.permit && claimActive(state.permit) ? permitCard() : state.consultApproved ? `<div class="consult-complete"><p>当前没有可继续拍摄的独占任务。已提交的记录请等待审核；到期或失败的悬赏会重新开放。</p><button class="primary wide" data-action="new-consult">咨询并领取悬赏 ${icon('arrow')}</button></div>` : ''}</div>
    ${state.consultApproved || state.permit ? '' : `<div class="composer-wrap"><div class="composer"><form id="chat-form"><button type="button" class="composer-icon" data-action="album" aria-label="拍照或选择图片" title="拍照或选择图片">${icon('image')}</button><input id="chat-input" name="message" inputmode="text" enterkeyhint="send" aria-label="发送给拍摄顾问" placeholder="说说你最拿手的一种手艺…" autocomplete="off" maxlength="1000" ${busy ? 'disabled' : ''}><button type="button" class="composer-icon" data-action="voice" aria-label="语音输入" title="语音输入">${icon('mic')}</button></form></div></div>`}<div id="conversation-end"></div>${taskPool()}</section>
    <aside class="workflow"><div class="section-label"><span>从专业经验，到训练数据</span></div><div class="steps">${[['01','说清拿手的手艺','内容、工作场景和拍摄工具'],['02','确认悬赏机会','模拟查重、复杂度评估与指导'],['03','完整记录一次操作','6 小时独占，可放弃重拍']].map(([n,t,d],i)=>`<div class="step ${state.permit && i===2 || !state.permit && i===Math.min(state.brief.length,1) ? 'current' : ''}"><span>${n}</span><div><h3>${t}</h3><p>${d}</p></div>${icon(i<Math.min(state.brief.length,2)?'check':'arrow')}</div>`).join('')}</div><div class="shoot-spec"><div class="tiny-icon">${icon('film')}</div><h3>让手上的经验，看得清楚</h3><p>双手、工具、工件同时可见<br>从准备到完成，保留连续操作和讲解</p><span>${icon('shield')} 横屏 1080p · 有声 · 最长 30 分钟</span></div><div class="prototype-note">${icon('info')}<p>Spartan300-V1 的简易采集版。当前对话、悬赏评估、上传和收益均为本地模拟。</p></div></aside></div>
`;
}
function permitCard() { return `<div class="permit-card"><div class="permit-top"><span>${icon('check')} 模拟评估通过</span><small>6 小时独占悬赏</small></div><h3>${esc(craftCopy(state.permit.title))}</h3>${windowNotice(state.permit)}<p>手艺悬赏示例 <b>¥ 200 / 次</b><span>全新且符合复杂度要求的手艺 · 首个合格提交</span></p><div class="guidance"><b>这次这样拍</b><ol><li>优先第一视角，让双手、工具和工件持续入镜。</li><li>从准备、关键操作到完成结果，连续记录一种手艺的完整操作。</li><li>边操作边讲解判断依据、用力方式和容易出错的细节。</li><li>保留声音，避开正脸、单据和敏感信息。</li></ol></div><p class="permit-disclaimer">查重与复杂度仅为模拟；实际资格和悬赏以正式审核为准。</p><button class="primary wide" data-action="shoot">进入拍摄准备 ${icon('arrow')}</button><small class="permit-note">窗口内可放弃重拍，仅能提交一条视频；成功提交后等待审核。</small></div>`; }
function coverFor(r) { const cover = r.cover || (/木|榫卯|装合|铰链/.test(r.title) ? 'assembly' : /电气|接线|连接器/.test(r.title) ? 'electrical' : 'cooking'); return {assembly:'/assets/skill-assembly.jpg',electrical:'/assets/skill-electrical.svg',cooking:'/assets/skill-cooking.jpg'}[cover] || '/assets/skill-cooking.jpg'; }
function recordCard(r) { const [label,color] = statuses[r.status] || statuses.local; return `<button class="record-card" data-record="${esc(r.id)}"><div class="record-thumb"><img src="${coverFor(r)}" alt="${esc(craftCopy(r.title))}方向示例图"><span>${icon(r.simulated ? 'film' : 'camera')}</span><small>${time(r.duration)}</small></div><div class="record-info"><div class="record-line"><span class="status ${color}">${label}</span><span class="record-date">${esc(r.date)}</span></div><h3>${esc(craftCopy(r.title))}</h3><p>${r.simulated ? '模拟拍摄' : '真实本地录制'} <span>·</span> 1920 × 1080 <span>·</span> 有声</p><div class="record-bottom"><span>${r.status === 'approved' ? '演示收益' : r.status === 'local' ? '未上传至服务器' : r.status === 'review' ? '等待审核结果' : r.status==='draft'?'拍摄结束 · 选择放弃或上传':r.status==='discarded'?'已放弃 · 可在窗口内重拍':r.status==='failed'?'悬赏已释放':r.status==='accepted'?'审核流程演示':r.status==='interrupted'?'录制中断 · 可放弃重拍':'等待模拟补传'}</span><b>${r.amount ? `+ ¥ ${money(r.amount)}` : '查看详情 →'}</b></div></div></button>`; }
function records() {
  const visible = state.records.filter(r => filter === '全部' || filter === '待处理' && ['draft','review','cached','interrupted','local'].includes(r.status) || filter === '已采纳' && ['approved','accepted'].includes(r.status));
  return `<div class="page-heading"><div><span class="eyebrow">每一种手艺，都是专业经验</span><h1>拍摄记录<span class="lime-dot"></span></h1></div><span class="heading-count">${state.records.length} 条记录</span></div><div class="stats-row"><div><b>${state.records.length.toString().padStart(2,'0')}</b><span>累计拍摄</span></div><div><b>${state.records.filter(r=>['approved','accepted'].includes(r.status)).length.toString().padStart(2,'0')}</b><span>模拟已采纳</span></div><div><b class="accent">¥ ${money(state.total)}</b><span>累计模拟收益</span></div></div><div class="record-toolbar"><div class="filter-tabs">${['全部','待处理','已采纳'].map(f=>`<button data-filter="${f}" class="${filter===f?'active':''}">${f}</button>`).join('')}</div><span>最近拍摄优先</span></div><div class="records-list">${visible.length ? visible.map(recordCard).join('') : `<div class="empty">${icon('film')}<h3>这里还没有采集记录</h3><p>和顾问说说你的拿手的手艺，开始下一次采集。</p><button class="primary" data-action="advisor">去发现拍摄机会 ${icon('arrow')}</button></div>`}</div><p class="page-footnote">示例图参考 V1，模拟记录不会上传服务器，真实录制文件仅保存在本浏览器。</p>`;
}
function profile() { const pending = state.settlements.some(s=>s.status==='pending'); return `<div class="page-heading"><div><span class="eyebrow">我的手艺 · 我的采集</span><h1>我的工作台<span class="lime-dot"></span></h1></div></div><div class="profile-layout"><section><div class="profile-intro"><div class="profile-avatar">${icon('user')}</div><div><h2>${esc(serverProfile?.name || `手艺人 ${phone.slice(-4)}`)}</h2><p>${phone.slice(0,3)} ${phone.slice(3,7)} ${phone.slice(7)} <span>· 演示账号</span></p></div><span class="creator-tag">手艺采集者</span></div><div class="balance-card"><div class="balance-top"><span>${icon('wallet')} 可结算余额</span><span>模拟收益</span></div><div class="balance-number"><small>¥</small> ${money(state.balance)}</div><p>把专业经验记录下来，让手艺走得更远。</p><div class="balance-bottom"><span>累计模拟收益 <b>¥ ${money(state.total)}</b></span><button data-action="settle" ${pending || state.balance<=0?'disabled':''}>${pending?'申请处理中':'全额结算'} ${icon('arrow')}</button></div></div><div class="section-title"><h3>结算申请</h3><span>${state.settlements.length} 条记录</span></div>${state.settlements.length ? state.settlements.map(s=>`<div class="settlement-row"><span class="settle-icon">${icon('wallet')}</span><div><b>全额结算申请</b><p>${esc(s.date)} · ${settlementStatusText(s)}</p>${s.note?`<p>处理备注：${esc(s.note)}</p>`:''}</div><strong>¥ ${money(s.amount)}</strong>${s.status==='pending'?`<button class="text-button" data-cancel-settle="${s.id}">撤销</button>`:''}</div>`).join('') : '<div class="subtle-empty">还没有结算申请，下一份回报在路上。</div>'}<div class="settlement-note">${icon('info')}<p>全额结算申请会同步到配套后台，由管理员线下联系并登记处理结果。当前均为演示金额，不会发起真实付款。</p></div></section><aside><div class="settings-list"><button data-action="spec">${icon('film')} 拍摄规范 ${icon('chevron')}</button><button data-action="support">${icon('headphones')} 联系与结算说明 ${icon('chevron')}</button><button data-action="about">${icon('info')} 关于 Spartan300 ${icon('chevron')}</button><button data-action="logout">${icon('user')} 退出登录 ${icon('chevron')}</button></div><div class="profile-signature">${icon('spark')}<p>让你的手艺，<br>成为机器人的真实经验。</p><span>SPARTAN300 / V0.1</span></div></aside></div>`; }
function addMessage(role,text,image) { state.messages.push({role,text,image}); save(); }
async function send(text) {
  if (!text.trim() || busy) return;
  addMessage('user',text.trim());
  if (state.permit) { state.permit = null; state.brief = []; addMessage('assistant','开始咨询另一种手艺；已领取任务的独占窗口继续计时，可从我的独占任务继续拍摄。'); }
  state.brief.push(text.trim()); busy=true; render();
  await new Promise(r=>setTimeout(r,650));
  if (state.brief.length === 1) addMessage('assistant','这种手艺了解了。你准备在哪个工作场景操作？请说明工件、操作台和光线，能否获得许可并完整拍到双手、工具和工件。');
  else if (state.brief.length === 2) addMessage('assistant','最后确认工具：这种手艺需要哪些专业工具？用什么手机和头戴或胸前支架拍摄？能否横屏录制、保持双手可见，并边操作边讲解关键判断？');
  else {
    const expertSkill = /工序|手艺|刀工|拆骨|面点|烘焙|榫卯|木工|装配|接线|精修|修复|加工|维修|嫁接|焊接|缝纫|裁剪|皮具|实验|检测|机床|车削|铣削|抛光|打磨|编织|雕刻|拉花|插花|包装|物流|护理|实验|修剪/.test(state.brief[0]);
    const repeated = /系统已收录|重复(?:工序|手艺)|已有同样(?:工序|手艺)/.test(state.brief.join(' '));
    const rejected = /偷拍|私密|违法|危险驾驶|无声|不能录音|不录音|未授权/.test(state.brief.join(' '));
    if (rejected) { addMessage('assistant','本次模拟评估未通过：内容中存在隐私、安全或录音条件问题。请改为安全、获得许可且能录音的场景，再重新描述拍摄内容。当前未发放拍摄授权。'); state.brief=[]; }
    else if(!expertSkill || repeated) {addMessage('assistant',repeated ? '本次模拟查重未通过：该手艺已收录，未发放授权。请换一种你擅长的、尚未收录的高技能手艺。真实查重需要外部后端。' : '本次模拟评估未通过：请描述专家从事的具体高技能手艺，例如精细刀工、榫卯修配或连接器装配。风景和普通生活片段不属于本项目的机器人训练采集方向。请重新说说你的拿手的手艺。');state.brief=[];}
    else { try { await claimBounty(state.brief[0].slice(0,160),state.brief); } catch(error) { addMessage('assistant',error.message+'。请稍后重新咨询或选择已释放的悬赏。');state.brief=[];busy=false;save();render();return; } addMessage('assistant','模拟查重与复杂度评估已通过：这次记录一种专业手艺的完整操作，供机器人学习操作经验。已生成针对双手、工具和关键判断的拍摄指导，以及 6 小时独占窗口。放弃可重拍，期限不重置；窗口内成功提交一条视频后等待审核。真实悬赏资格仍需正式审核。'); state.brief=[]; }
  }
  busy=false; save(); render();
}
function about() { modal('关于这个原型', `<div class="sheet-body"><span class="eyebrow accent">SPARTAN300 · V0.1</span><h3>记录专家手艺，为机器人训练积累经验。</h3><p>这是 Spartan300-V1 的简易采集版，沿用 V1 的 DeepReach 品牌、米白与陶土橙配色及专家采集示例图。目标是记录专家完成高技能手工劳动的完整操作、工具使用和关键判断。</p><p>已实现：本机账户登录与注册、三标签页面、6 小时独占悬赏、本地采集记录，以及可与 PC 后台同步的结算申请和用户管理。</p><p>真实设备录制：浏览器支持且处于 HTTPS 或 localhost 时，可调用摄像头与麦克风，按约 5 秒分片缓存到 IndexedDB，支持本地回放与导出。</p><p>悬赏独占、到期释放与提交状态由本机服务记录；AI 对话、外部评估、视频上传、审核和收益仍为模拟。用户与结算记录由本机服务保存，可在配套 PC 后台管理，不触发真实资金或自动联系。</p><p>局域网 HTTP 可完整测试交互和模拟拍摄；手机真实录制需要可信 HTTPS。账户与结算状态可通过本机服务跨设备同步；聊天与视频仍保存在各自浏览器，清理浏览器可能丢失这些本地数据。</p><button class="primary wide" data-action="close">知道了 ${icon('check')}</button></div>`); }
function spec() { modal('拍摄规范', `<div class="sheet-body"><div class="spec-grid"><span>画面规格<b>横屏 1920 × 1080</b></span><span>录制时长<b>最长 30 分钟</b></span><span>声音要求<b>必须开启麦克风</b></span><span>视频来源<b>仅现场录制</b></span></div><p>优先第一视角采集，双手、工具和工件持续可见。从准备、关键操作到完成结果，连续记录完整操作过程，边做边讲解专业判断。仅在获得许可的工作环境拍摄。</p><p>每次评估通过并领取悬赏后，开启 6 小时独占窗口。拍摄结束可选择放弃或上传；放弃、中断后可在原窗口内重拍，期限不会重置。成功提交一条视频后等待审核；到期未提交或任务判失败，悬赏向所有用户释放。</p><p>仅在录制前支持前后摄像头切换。录制中切换入口锁定。正式视频入口不接受相册文件。</p><p>真实录制在设备不支持 1920 × 1080 或没有音轨时会阻止开始。请保持页面在前台；锁屏、浏览器退出和系统中断不保证连续录制。</p><button class="primary wide" data-action="close">我了解了</button></div>`); }
function settle() {
  if(USE_SERVER && !serverConnected){toast('正在连接本机结算服务，请稍后重试');refreshAccount();return;}
  if(state.balance<=0 || state.settlements.some(s=>s.status==='pending')) return toast('当前没有可申请的全额余额');
  modal('申请全额结算', `<form id="settle-form" class="sheet-body"><div class="settle-amount"><span>本次申请金额 · 模拟</span><b>¥ ${money(state.balance)}</b></div><label>管理员联系手机号<input name="contact" type="tel" inputmode="numeric" value="${phone}" pattern="1[3-9][0-9]{9}" required></label><label>微信号（选填）<input name="wechat" placeholder="便于管理员线下联系" maxlength="50"></label><p class="notice">申请会提交到本机结算后台，演示余额转入待结算。管理员线下联系并处理；此页面不会发起真实付款，处理前可撤销申请。</p><label class="check-label"><input type="checkbox" required> 我知道这是演示金额，并同意提交全额结算申请</label><button class="primary wide" type="submit">确认申请 ¥ ${money(state.balance)} ${icon('arrow')}</button></form>`);
}
function attachment(kind) {
  if(kind==='voice') { modal('语音输入 · 转写演示', `<form id="voice-form" class="sheet-body"><div class="voice-art">${icon('mic')}<div class="wave">${Array.from({length:19},(_,i)=>`<i style="height:${12+(i*17)%37}px"></i>`).join('')}</div></div><p>当前提供语音入口和转写结果模拟，没有调用麦克风或语音识别服务。</p><label>模拟识别内容<textarea name="transcript" required maxlength="1000">我想记录自己做手工拆骨和精细刀工的完整操作过程</textarea></label><div class="voice-actions"><button type="button" class="secondary" data-action="close">取消</button><button type="submit" class="primary">发送模拟转写 ${icon('arrow')}</button></div></form>`); return; }
  modal('添加参考图片', `<div class="sheet-body"><p>图片仅用于和顾问沟通手艺和操作条件，不会作为正式视频提交。不会上传或进行真实 AI 图片识别。</p><label class="file-picker">${icon('image')}<b>拍照或从相册选择</b><span>仅支持图片 · 不接受视频 · 最大 5 MB</span><input id="reference-photo" type="file" accept="image/*"></label><p class="small muted">系统是否直接打开相机由手机浏览器决定。选图后请继续输入手艺、工作场景和工具。</p></div>`);
}
async function photoSelected(file) {
  if(!file) return;
  if(!file.type.startsWith('image/') || file.size>5*1024*1024) return toast('请选择不超过 5 MB 的图片');
  const img = new Image(); const url = URL.createObjectURL(file); img.src=url;
  try { await img.decode(); const canvas=document.createElement('canvas'); const ratio=Math.min(1,640/img.width); canvas.width=img.width*ratio; canvas.height=img.height*ratio; canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height); addMessage('user','咨询参考图片（仅本地）',canvas.toDataURL('image/jpeg',.65)); addMessage('assistant','参考图片已添加到本地对话，当前没有真实图片识别。请用文字补充你想拍的内容、现场环境和工具。'); closeModal(); render(); } catch { toast('无法读取这张图片，请换一张 JPG 或 PNG'); } finally { URL.revokeObjectURL(url); }
}

// Real media is stored only in this browser. No upload endpoint exists.
let dbPromise;
function db() { return dbPromise ||= new Promise((resolve,reject)=> { const req=indexedDB.open('spartan300-media',1); req.onupgradeneeded=()=>req.result.createObjectStore('chunks',{keyPath:'key'}); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
async function storeChunk(id,index,blob) { const database=await db(); return new Promise((resolve,reject)=> { const tx=database.transaction('chunks','readwrite'); tx.objectStore('chunks').put({key:`${id}:${String(index).padStart(6,'0')}`,id,index,blob}); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error); }); }
async function readMedia(id) { const database=await db(); return new Promise((resolve,reject)=> { const req=database.transaction('chunks').objectStore('chunks').getAll(); req.onsuccess=()=>{const chunks=req.result.filter(x=>x.id===id).sort((a,b)=>a.index-b.index); resolve(chunks.length ? new Blob(chunks.map(x=>x.blob),{type:chunks[0].blob.type}) : null);};req.onerror=()=>reject(req.error); }); }
function openShoot() {
  if(!claimActive(state.permit)) return toast('请先完成评估，领取 6 小时独占悬赏');
  media={ mode:'sim',facing:'environment',stream:null,recorder:null,recording:false, seconds:0, start:0, chunks:0, queued:0, sent:0, offline:!navigator.onLine, id:uid(), writes:[], failure:false, title:state.permit.title, permitId:state.permit.id,bountyId:state.permit.bountyId,expiresAt:state.permit.expiresAt, ready:false };
  $('#overlay').innerHTML=`<div class="camera-modal" role="dialog" aria-modal="true" aria-label="拍摄工作台"><header class="camera-header"><button class="icon-button" data-action="exit-shoot" aria-label="返回顾问">${icon('back')}</button><span>拍摄工作台 <small>6 小时独占窗口</small></span><span class="status green" id="shoot-mode-label">模拟拍摄</span></header><div class="camera-stage" id="camera-stage"><div class="camera-scene"></div><span class="camera-example-label">第一视角示例 · 非实时画面</span><video id="camera-video" muted autoplay playsinline></video><div class="camera-grid"><i></i><i></i></div><span class="camera-badge">1920 × 1080 · 16:9</span><span class="mic-badge">${icon('mic')} 录音必需</span><div class="camera-center" id="camera-center">${icon('camera')}<h3>准备记录一次完整操作</h3><p>V1 第一视角参考图 · 模拟画面，不调用摄像头</p></div><div class="camera-timer" id="camera-timer">00:00 <span>/ 30:00</span></div></div><div class="camera-controls"><div class="mode-switch"><button class="active" data-mode="sim">模拟拍摄</button><button data-mode="real">真实设备录制</button></div><div id="camera-notice" class="camera-notice">模拟分片、断网缓存和补传仅演示状态变化，不会发送视频。</div><div class="preflight" id="preflight"><label class="check-label"><input id="mic-confirm" type="checkbox"> 确认保留现场声音（模拟）</label><label class="check-label"><input id="landscape-confirm" type="checkbox"> 确认横屏拍摄 · 1920 × 1080</label></div><div class="upload-strip"><span id="network-label">${icon('wifi')} ${media.offline?'离线缓存演示':'模拟网络正常'}</span><span id="chunk-label">0 分片 · 等待开始</span><button class="text-button" data-action="network" id="network-button">模拟断网</button></div><div class="record-controls"><button class="control-side" data-action="switch-camera" id="switch-camera">${icon('rotate')}<span>后置摄像头</span></button><button class="record-button" id="record-button" data-action="record" aria-label="开始模拟录制"><span></span></button><span class="control-side limit">${icon('clock')}<span>最长 30 分钟</span></span></div><p class="record-hint" id="record-hint">结束后可放弃或上传 · 重拍不会延长独占窗口</p></div></div>`;
}
async function chooseMode(mode) {
  if(!media || media.recording) return;
  stopStream(); media.mode=mode; media.ready=false;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  $('#shoot-mode-label').textContent=mode==='sim'?'模拟拍摄':'真实设备 · 本地保存';
  $('#camera-video').style.display=mode==='real'?'block':'none';
  $('.camera-example-label').style.display=mode==='sim'?'block':'none';
  $('#camera-center').style.display='flex';
  $('#network-button').disabled=mode==='real';
  $('#mic-confirm').checked=false; $('#landscape-confirm').checked=false;
  $('#mic-confirm').parentElement.lastChild.textContent=mode==='sim'?' 确认保留现场声音（模拟）':' 确认开启真实麦克风';
  $('#record-button').setAttribute('aria-label', mode==='real'?'开始真实录制':'开始模拟录制');
  $('#camera-notice').textContent=mode==='sim'?'模拟分片、断网缓存和补传仅演示状态变化，不会发送视频。':'真实视频分片仅缓存本浏览器，不上传。请保持页面前台，结束后可导出。';
  if(mode==='real') await prepareCamera(); else $('#camera-center').innerHTML=`${icon('camera')}<h3>准备记录一次完整操作</h3><p>V1 第一视角参考图 · 模拟画面，不调用摄像头</p>`;
}
function stopStream() { media?.stream?.getTracks().forEach(t=>t.stop()); if(media) media.stream=null; }
async function prepareCamera() {
  const current=media;
  if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { $('#camera-center').innerHTML=`${icon('shield')}<h3>当前环境无法使用真实录制</h3><p>局域网 HTTP 请使用模拟拍摄。<br>真实录制需要可信 HTTPS 或本机 localhost，<br>并支持摄像头、麦克风和 MediaRecorder。</p>`; return; }
  $('#camera-center').innerHTML=`${icon('camera')}<h3>正在请求摄像头和麦克风…</h3><p>请允许权限，检查设备是否支持 1080p</p>`;
  try {
    await db();
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:{exact:1920},height:{exact:1080},facingMode:{ideal:current.facing}},audio:true});
    if(media!==current || current.mode!=='real') {stream.getTracks().forEach(t=>t.stop());return;}
    const settings=stream.getVideoTracks()[0]?.getSettings();
    if(settings?.width!==1920 || settings?.height!==1080 || !stream.getAudioTracks().length) {stream.getTracks().forEach(t=>t.stop());throw Error('设备未提供 1920 × 1080 画面和必需的音轨');}
    media.stream=stream; media.ready=true; $('#camera-video').srcObject=stream; $('#camera-center').style.display='none';
    stream.getTracks().forEach(t=> {const interrupted=()=>{if(media===current && media.recording){media.failure=true;finishRecording();toast('设备输入已中断，录制结束');}};t.addEventListener('ended',interrupted);t.addEventListener('mute',interrupted);});
  } catch(err) { if(media!==current) return; $('#camera-center').innerHTML=`${icon('info')}<h3>暂时无法录制</h3><p>${esc(err.name==='NotAllowedError'?'请允许摄像头与麦克风权限':err.name==='OverconstrainedError'?'此摄像头不支持要求的 1920 × 1080 规格':err.message || '设备不支持或权限被拒绝')}<br>可切换模拟拍摄继续体验。</p>`; }
}
function consumePermit() { if(!claimActive(state.permit) || state.permit.id!==media.permitId) throw Error('独占窗口已结束或悬赏已失效，请重新咨询'); }
async function startRecording() {
  if(!media || media.recording || media.starting) return;
  if(!$('#mic-confirm').checked || !$('#landscape-confirm').checked) return toast('请先确认录音和横屏拍摄要求');
  const current=media;
  if(USE_SERVER){current.starting=true;try{applyBounties(await accountApi(`/api/me/bounties/${encodeURIComponent(current.permitId)}/start`,{method:'POST',body:{}}));if(media!==current)return;}catch(error){toast(error.message);await refreshBounties(false);return;}finally{current.starting=false;}}
  if(media.mode==='real') {
    if(!media.ready || !media.stream?.getAudioTracks().some(t=>t.readyState==='live' && t.enabled)) return toast('需要可用的 1080p 摄像头和真实麦克风才能开始');
    if(innerHeight>innerWidth) return toast('真实录制请先将设备横屏');
    if(!claimActive(state.permit) || state.permit.id!==media.permitId)return toast('独占窗口已结束或悬赏已失效');
    try {
      const current=media; const preferred=['video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
      media.recorder=new MediaRecorder(media.stream,preferred?{mimeType:preferred}:{});
      media.recorder.ondataavailable=e=> { if(e.data.size){const idx=current.chunks++;const writing=storeChunk(current.id,idx,e.data).catch(()=>{current.failure=true;toast('本地存储写入失败，请导出已保存分片');if(current.recording) finishRecording();});current.writes.push(writing); if(media===current) updateRecordingUI();} };
      media.recorder.onerror=()=>{current.failure=true;finishRecording();};
      media.recorder.onstop=()=>finalizeRecording(current);
      media.recorder.start(5000); consumePermit();
    } catch(e) { return toast(`无法开始录制：${e.message}`); }
  } else { try { consumePermit(); } catch(e){return toast(e.message);} }
  media.recording=true; media.start=Date.now(); state.activeRecording={id:media.id,title:media.title,claimId:media.permitId,bountyId:media.bountyId,expiresAt:media.expiresAt,duration:0,chunks:0,simulated:media.mode==='sim'};save(); $('#camera-center').style.display='none'; $('#preflight').style.display='none'; $('#record-button').classList.add('recording'); $('#record-button').setAttribute('aria-label','结束录制'); $('#record-hint').textContent='正在录制 · 结束后预览并选择放弃或上传'; $('#switch-camera').disabled=true; document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=true); $('#camera-stage').classList.add('is-recording');
  media.timer=setInterval(()=>{ if(!media?.recording)return; media.seconds=Math.min(1800,Math.floor((Date.now()-media.start)/1000)); if(media.mode==='sim') {const n=Math.floor(media.seconds/5); while(media.chunks<n){media.chunks++;media.offline?media.queued++:media.sent++;}} updateRecordingUI(); if(media.seconds>=1800)finishRecording(); },250);
}
function updateRecordingUI() { if(!media || !$('#chunk-label')) return; if(state.activeRecording && state.activeRecording.chunks!==media.chunks){state.activeRecording.chunks=media.chunks;state.activeRecording.duration=media.seconds;save();} $('#camera-timer').innerHTML=`${time(media.seconds)} <span>/ 30:00</span>`; $('#chunk-label').textContent=media.mode==='real'?`${media.chunks} 个真实分片 · 仅本地缓存`:`${media.chunks} 分片 · 模拟预缓存 ${media.sent} · 离线缓存 ${media.queued}`; $('#network-label').innerHTML=`${icon('wifi')} ${media.mode==='real'?'仅本地保存':media.offline?'模拟离线 · 缓存中':'模拟网络正常'}`; }
function finishRecording() { if(!media?.recording)return; media.recording=false;clearInterval(media.timer);media.seconds=Math.min(1800,Math.max(1,Math.floor((Date.now()-media.start)/1000))); $('#record-button').disabled=true; $('#record-hint').textContent='正在保存到本浏览器…'; if(media.mode==='real' && media.recorder?.state!=='inactive')media.recorder.stop();else finalizeRecording(media); }
async function finalizeRecording(current) {
  stopStream(); await Promise.all(current.writes);
  if(current.mode==='sim'){current.chunks=Math.max(1,Math.ceil(current.seconds/5));current.queued=current.offline?current.chunks:0;current.sent=current.offline?0:current.chunks;}
  const record={id:current.id,title:current.title,date:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),duration:current.seconds,status:current.failure?'interrupted':'draft',claimId:current.permitId,bountyId:current.bountyId,expiresAt:current.expiresAt,uploadOffline:current.offline,amount:0,simulated:current.mode==='sim',chunks:current.chunks,queued:current.queued};
  state.records.unshift(record); delete state.activeRecording;save();if(USE_SERVER && serverConnected)accountApi('/api/me/activity',{method:'POST',body:{recordCount:state.records.length}}).catch(()=>{}); media=null;closeModal();tab='records';render();showRecord(record.id);toast('拍摄已结束，请预览并选择放弃或上传');
}
function exitShoot() { if(media?.recording){modalCannotExit();return;} stopStream(); media=null;closeModal();render(); }
function modalCannotExit(){toast('请先结束录制，再选择放弃或上传；窗口内可以重拍');}
function recordActions(record) {
  const claim=claimForRecord(record),active=claimActive(claim),unsubmitted=['draft','cached','interrupted'].includes(record.status);
  if(unsubmitted)return `${active?windowNotice(claim):'<p class="notice">独占窗口已结束或悬赏已失效，任务已重新开放；本次视频无法提交。</p>'}${record.status==='interrupted'?'<p>录制曾中断，请检查文件后放弃重拍。</p>':''}<div class="record-decision-actions"><button class="secondary" data-discard-record="${esc(record.id)}">放弃本次</button>${record.status!=='interrupted'?record.status==='cached'?`<button class="primary" data-retry="${esc(record.id)}" ${active?'':'disabled'}>模拟恢复网络并补传</button>`:`<button class="primary" data-upload-record="${esc(record.id)}" ${active?'':'disabled'}>上传（模拟） ${icon('upload')}</button>`:''}</div><p class="decision-note">视频保存在本浏览器。点击上传仅提交模拟审核记录，不会向服务器发送视频。</p><button class="text-button wide" data-action="return-records">稍后决定，返回拍摄记录</button>`;
  if(record.status==='discarded')return `<p class="notice">本次拍摄已放弃，不会提交；保留的本地视频仍可导出。</p>${active?`${windowNotice(claim)}<button class="primary wide" data-resume-bounty="${esc(claim.id)}">重新拍摄</button>`:''}<button class="secondary wide" data-action="return-advisor">返回拍摄顾问</button>`;
  if(record.status==='failed')return `<p class="notice">悬赏已判失败，已重新向所有用户开放。原因：${esc(record.reviewNote || '请查看后台审核结果')}</p><button class="primary wide" data-action="return-advisor">返回顾问，重新咨询</button>`;
  if(record.status==='accepted')return `<section class="upload-result"><span class="upload-result-icon">${icon('check')}</span><div><span class="upload-demo-label">审核流程演示</span><h3>模拟审核通过</h3><p>此处不自动计入收益。</p></div></section><button class="primary wide" data-action="return-records">返回拍摄记录</button>`;
  return '';
}

async function showRecord(id) {
  const r=state.records.find(r=>r.id===id); if(!r)return;
  const [label,color]=statuses[r.status] || statuses.local;
  modal('采集详情', `<div class="sheet-body"><div class="detail-cover"><img src="${coverFor(r)}" alt="手艺方向示例图"><span>${icon('film')}</span><b>${esc(craftCopy(r.title))}</b><small>${r.simulated?'模拟作品 · 无视频文件':'真实本地录制'}</small></div><span class="status ${color}">${label}</span><div class="spec-grid"><span>视频规格<b>1920 × 1080 · 横屏</b></span><span>时长 / 声音<b>${time(r.duration)} · ${r.simulated?'模拟有声':'含音轨'}</b></span><span>分片数<b>${r.chunks} 个 · ${r.simulated?'模拟':'真实本地缓存'}</b></span><span>收益状态<b>${r.status==='approved'?`¥ ${money(r.amount)}`:r.status==='review'?'待审核':r.status==='accepted'?'演示通过 · 未计收益':'尚未计入收益'}</b></span></div>${r.simulated?'<p class="notice">此记录为模拟数据，没有实际录制文件、服务器上传或真实审核。</p>':'<p class="notice">真实分片仅保存在本浏览器。未上传至服务器，未参加真实审核。选择上传只会模拟提交审核，不会发送真实视频文件。</p><div id="local-playback"><p>正在读取本地文件…</p></div>'}${recordActions(r)}${r.status==='review'?`<section class="upload-result" role="status"><span class="upload-result-icon">${icon('check')}</span><div><span class="upload-demo-label">上传流程演示</span><h3>拍摄上传成功</h3><p>请等待审核结果。</p><small>模拟提交，不发送视频文件；已按时提交，等待审核期间不按 6 小时自动释放。</small></div></section><button class="primary wide" data-action="return-records">返回拍摄记录 ${icon('back')}</button>`:''}</div>`);
  if(!r.simulated) {try { const blob=await readMedia(id);const target=$('#local-playback');if(!target)return;if(blob){const url=URL.createObjectURL(blob);target.innerHTML=`<video controls playsinline src="${url}"></video><a class="primary wide" href="${url}" download="Spartan300-${id}.${blob.type.includes('mp4')?'mp4':'webm'}">导出本地视频 ${icon('upload')}</a>`;target.querySelector('video').addEventListener('emptied',()=>URL.revokeObjectURL(url),{once:true});}else target.innerHTML='<p>没有找到可播放分片，可能已被浏览器清理。</p>';}catch{$('#local-playback')?.replaceChildren(document.createTextNode('无法读取本地文件，请检查浏览器存储权限。'));}}
}
document.addEventListener('click',desktopInteractionGate,true);
document.addEventListener('submit',e=>{if(isDesktopBrowser()){e.preventDefault();e.stopImmediatePropagation();showMobileGate('login');}},true);
document.addEventListener('click', async e=> {
  const b=e.target.closest('button, [data-tab]'); if(!b || b.disabled)return;
  if(b.dataset.tab){tab=b.dataset.tab;render();window.scrollTo(0,0);return;}
  if(b.dataset.filter){filter=b.dataset.filter;render();return;}
  if(b.dataset.record){showRecord(b.dataset.record);return;}
  if(b.dataset.mode){chooseMode(b.dataset.mode);return;}
  if(b.dataset.retry){const r=state.records.find(r=>r.id===b.dataset.retry);if(r){r.uploadOffline=false;await uploadRecord(r.id);}return;}
  if(b.dataset.uploadRecord){await uploadRecord(b.dataset.uploadRecord);return;}
  if(b.dataset.discardRecord){discardRecord(b.dataset.discardRecord);return;}
  if(b.dataset.resumeBounty){resumeBounty(b.dataset.resumeBounty);return;}
  if(b.dataset.pickBounty){pickBounty(b.dataset.pickBounty);return;}
  if(b.dataset.cancelSettle){if(USE_SERVER){await cancelServerSettlement(b.dataset.cancelSettle);return;}const s=state.settlements.find(s=>s.id===b.dataset.cancelSettle);if(s?.status==='pending'){s.status='cancelled';state.balance+=s.amount;save();render();toast('本地模拟申请已撤销，余额已恢复');}return;}
  switch(b.dataset.action){
    case 'auth-login':authMode='login';renderAuth();break;
    case 'auth-register':authMode='register';renderAuth();break;
    case 'close':closeModal();break;
    case 'return-records':closeModal();tab='records';filter='全部';render();break;
    case 'profile':tab='profile';render();break;
    case 'advisor':tab='advisor';render();break;
    case 'return-advisor':closeModal();tab='advisor';render();break;
    case 'new-consult':if(!busy){write(`s300-last-consult-${phone}`,{messages:state.messages,brief:state.brief,permit:state.permit});state.messages=[];state.brief=[];state.permit=null;state.consultApproved=false;state.consultingNew=true;state.selectedBountyId=null;save();render();window.scrollTo(0,0);}break;
    case 'about':about();break;
    case 'spec':spec();break;
    case 'support':modal('联系与结算说明','<div class="sheet-body"><h3>由管理员线下联系付款</h3><p>申请结算时填写手机号与可选微信号，提交后会进入配套的本机结算后台。管理员查看申请后线下联系；当前没有配置真实通知或付款渠道。</p><p>系统没有接入支付渠道或真实资金流转。你可以在“我的”页面提交全额演示结算申请，并在管理员处理前撤销。</p><button class="primary wide" data-action="close">知道了</button></div>');break;
    case 'logout':accountEpoch++;if(USE_SERVER)await accountApi('/api/auth/logout',{method:'POST',body:{}}).catch(()=>{});serverConnected=false;serverProfile=null;phone='';write('s300-session','');render();break;
    case 'settle':settle();break;
    case 'voice':case 'album':attachment(b.dataset.action);break;
    case 'shoot':openShoot();break;
    case 'exit-shoot':exitShoot();break;
    case 'record':media?.recording?finishRecording():startRecording();break;
    case 'switch-camera':if(media && !media.recording){media.facing=media.facing==='environment'?'user':'environment';b.innerHTML=`${icon('rotate')}<span>${media.facing==='environment'?'后置':'前置'}摄像头</span>`;if(media.mode==='real'){stopStream();media.ready=false;await prepareCamera();}else toast(`已模拟切换${media.facing==='environment'?'后置':'前置'}摄像头`);}break;
    case 'network':if(media?.mode==='sim'){media.offline=!media.offline;if(!media.offline){media.sent+=media.queued;media.queued=0;}b.textContent=media.offline?'模拟恢复网络':'模拟断网';updateRecordingUI();toast(media.offline?'模拟离线：后续分片进入模拟缓存':'模拟恢复：待传分片已模拟补传');}break;
  }
});
document.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target;const data=new FormData(f);
  if(f.id==='auth-form' && USE_SERVER){await authenticateWithServer(f,data);return;}
  if(f.id==='auth-form'){const number=data.get('phone').trim(),password=data.get('password');const error=$('#auth-error');if(!/^1[3-9]\d{9}$/.test(number)){error.textContent='请输入有效的 11 位手机号码';return;}if(password.length<6){error.textContent='演示密码至少需要 6 位';return;}if(authMode==='register'){if(accounts[number]){error.textContent='此演示账号已注册，请直接登录';return;}accounts[number]=hash(password);write('s300-accounts',accounts);}else if(accounts[number]!==hash(password)){error.textContent='手机号或密码不正确，试试已填入的演示账号';return;}phone=number;write('s300-session',phone);load();render();if(!storageOK)toast('浏览器存储不可用，本次仅临时演示');}
  if(f.id==='chat-form')send(data.get('message'));
  if(f.id==='voice-form'){const text=data.get('transcript').trim();if(text){closeModal();send(`【模拟语音转写】${text}`);}}
  if(f.id==='settle-form' && USE_SERVER){await submitServerSettlement(f,data);return;}
  if(f.id==='settle-form'){if(state.balance<=0 || state.settlements.some(s=>s.status==='pending'))return;state.settlements.unshift({id:uid(),amount:state.balance,date:new Date().toLocaleString('zh-CN'),contact:data.get('contact'),wechat:data.get('wechat'),status:'pending'});state.balance=0;save();closeModal();render();toast('已生成本地模拟申请，未发送给管理员');}
});
document.addEventListener('focusin', () => syncChatFocus());
document.addEventListener('focusout', () => requestAnimationFrame(() => syncChatFocus()));
document.addEventListener('change',e=>{if(e.target.id==='reference-photo')photoSelected(e.target.files[0]);});
window.addEventListener('beforeunload',e=>{if(media?.recording){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',()=>{if(media?.recording){media.failure=true;finishRecording();}else stopStream();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden' && media?.recording && media.mode==='real'){media.failure=true;finishRecording();}});
window.addEventListener('offline',()=>{if(media?.mode==='sim'){media.offline=true;updateRecordingUI();$('#network-button').textContent='模拟恢复网络';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(media)exitShoot();else closeModal();}});
if(mobileDestinations.has(requestedMobileDestination)){authMode=requestedMobileDestination==='register'?'register':'login';tab=['records','profile'].includes(requestedMobileDestination)?requestedMobileDestination:'advisor';}
if(!isDesktopBrowser() && phone && accounts[phone])load();render();
if(isDesktopBrowser() && mobileDestinations.has(requestedMobileDestination))showMobileGate(requestedMobileDestination);
if(USE_SERVER && !isDesktopBrowser()){connectAccount();setInterval(()=>{if(phone && tab==='profile')refreshAccount();},5000);setInterval(()=>{if(phone && !media && !$('#overlay').innerHTML && document.visibilityState!=='hidden')refreshBounties();},10000);setInterval(tickBountyWindows,1000);}
