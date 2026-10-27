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
    applyServerAccount(result,true);render();
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
    applyServerAccount(result,true);render();
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
function closeModal() { $('#overlay').innerHTML = ''; }
function brand() { return `<div class="brand"><img src="/assets/deepreach-logo.png" alt="DeepReach" width="104" height="55"><span class="brand-sub">手艺悬赏计划<small>Spartan300 · 简易采集</small></span></div>`; }
function renderAuth() {
  $('#app').innerHTML = `<div class="auth-layout"><section class="auth-story">${brand()}<div class="story-content"><span class="eyebrow">EXPERT SKILLS. REAL-WORLD DATA.</span><h1>你多年练成的，<br>值得被记录<span>。</span></h1><p>把拿手的手艺完整拍下来，<br>为机器人训练，留下真实的手上经验。</p><div class="story-foot"><span class="line"></span> 记录专家经验 · 让机器人理解真实操作</div></div><div class="story-coordinate">EXPERT DEMONSTRATIONS <span>SPARTAN300 / V0.1</span></div></section><section class="auth-panel"><div class="auth-mobile-brand">${brand()}</div><div class="auth-card"><span class="eyebrow accent">DEEPREACH · 手艺悬赏计划</span><h2>${authMode === 'login' ? '欢迎回来' : '开始记录手艺'}<span class="lime-dot"></span></h2><p class="muted">${authMode === 'login' ? '登录，准备记录你的拿手的手艺' : '注册连接本机服务的演示账号'}</p><div class="auth-tabs"><button data-action="auth-login" class="${authMode === 'login' ? 'active' : ''}">手机号登录</button><button data-action="auth-register" class="${authMode === 'register' ? 'active' : ''}">注册账号</button></div><form id="auth-form"><label>手机号码<div class="phone-field"><span>+86</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" placeholder="请输入手机号码" required value="${authMode === 'login' ? '13800138000' : ''}"></div></label><label>密码<input name="password" type="password" autocomplete="${authMode === 'login' ? 'current-password' : 'new-password'}" minlength="6" maxlength="64" placeholder="至少 6 位，仅使用演示密码" value="${authMode === 'login' ? 'spartan300' : ''}" required></label><p id="auth-error" class="form-error" role="alert"></p><button class="primary wide" type="submit">${authMode === 'login' ? '进入手艺采集工作台' : '创建演示账号'} ${icon('arrow')}</button></form><div class="demo-credentials">${icon('info')}<div>演示账号 13800138000<br><span>密码 spartan300 · 已为你填好</span></div></div><p class="auth-note">V0.1 本地原型 · 账号连接本机演示服务<br>请勿使用真实密码，评估与收益均为演示数据。</p></div><span class="auth-footer">SPARTAN300 © 2026 <b>V0.1 PROTOTYPE</b></span></section></div>`;
}
const statuses = { review: ['模拟审核中', 'amber'], approved: ['模拟已采纳', 'green'], cached: ['模拟待补传', 'amber'], local: ['本地已保存', 'blue'], interrupted: ['录制已中断', 'amber'] };
function header() { return `<header class="topbar">${brand()}<div class="header-right"><span class="prototype-label">V0.1 <span>本地原型</span></span><button class="avatar" data-action="profile" aria-label="我的账户">${phone.slice(-2)}</button></div></header>`; }
function syncChatFocus(forceOff = false) {
  const root = document.documentElement;
  if (!root) return;
  const editing = !forceOff && document.activeElement?.id === 'chat-input';
  root.classList.toggle('chat-input-active', editing);
}
function render() {
  syncChatFocus(true);
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
    ${busy ? '<div class="typing"><i></i><i></i><i></i><span>正在模拟分析手艺…</span></div>' : ''}${state.permit ? permitCard() : state.consultApproved ? `<div class="consult-complete"><p>本次拍摄授权已使用。开始下一条视频前，需要重新评估。</p><button class="primary wide" data-action="new-consult">换一种手艺，重新评估 ${icon('arrow')}</button></div>` : ''}</div>
    ${state.consultApproved || state.permit ? '' : `<div class="composer-wrap"><div class="composer"><form id="chat-form"><button type="button" class="composer-icon" data-action="album" aria-label="拍照或选择图片" title="拍照或选择图片">${icon('image')}</button><input id="chat-input" name="message" inputmode="text" enterkeyhint="send" aria-label="发送给拍摄顾问" placeholder="说说你最拿手的一种手艺…" autocomplete="off" maxlength="1000" ${busy ? 'disabled' : ''}><button type="button" class="composer-icon" data-action="voice" aria-label="语音输入" title="语音输入">${icon('mic')}</button></form></div></div>`}<div id="conversation-end"></div></section>
    <aside class="workflow"><div class="section-label"><span>从专业经验，到训练数据</span></div><div class="steps">${[['01','说清拿手的手艺','内容、工作场景和拍摄工具'],['02','确认悬赏机会','模拟查重、复杂度评估与指导'],['03','完整记录一次操作','一次授权，只拍摄一条视频']].map(([n,t,d],i)=>`<div class="step ${state.permit && i===2 || !state.permit && i===Math.min(state.brief.length,1) ? 'current' : ''}"><span>${n}</span><div><h3>${t}</h3><p>${d}</p></div>${icon(i<Math.min(state.brief.length,2)?'check':'arrow')}</div>`).join('')}</div><div class="shoot-spec"><div class="tiny-icon">${icon('film')}</div><h3>让手上的经验，看得清楚</h3><p>双手、工具、工件同时可见<br>从准备到完成，保留连续操作和讲解</p><span>${icon('shield')} 横屏 1080p · 有声 · 最长 30 分钟</span></div><div class="prototype-note">${icon('info')}<p>Spartan300-V1 的简易采集版。当前对话、悬赏评估、上传和收益均为本地模拟。</p></div></aside></div>
`;
}
function permitCard() { return `<div class="permit-card"><div class="permit-top"><span>${icon('check')} 模拟评估通过</span><small>单次拍摄授权</small></div><h3>${esc(craftCopy(state.permit.title))}</h3><p>手艺悬赏示例 <b>¥ 200 / 次</b><span>全新且符合复杂度要求的手艺 · 首个合格提交</span></p><div class="guidance"><b>这次这样拍</b><ol><li>优先第一视角，让双手、工具和工件持续入镜。</li><li>从准备、关键操作到完成结果，连续记录一种手艺的完整操作。</li><li>边操作边讲解判断依据、用力方式和容易出错的细节。</li><li>保留声音，避开正脸、单据和敏感信息。</li></ol></div><p class="permit-disclaimer">查重与复杂度仅为模拟；实际资格和悬赏以正式审核为准。</p><button class="primary wide" data-action="shoot">进入拍摄准备 ${icon('arrow')}</button><small class="permit-note">开始录制即消耗本次授权，中止后也需重新评估。</small></div>`; }
function coverFor(r) { const cover = r.cover || (/木|榫卯|装合|铰链/.test(r.title) ? 'assembly' : /电气|接线|连接器/.test(r.title) ? 'electrical' : 'cooking'); return {assembly:'/assets/skill-assembly.jpg',electrical:'/assets/skill-electrical.svg',cooking:'/assets/skill-cooking.jpg'}[cover] || '/assets/skill-cooking.jpg'; }
function recordCard(r) { const [label,color] = statuses[r.status] || statuses.local; return `<button class="record-card" data-record="${esc(r.id)}"><div class="record-thumb"><img src="${coverFor(r)}" alt="${esc(craftCopy(r.title))}方向示例图"><span>${icon(r.simulated ? 'film' : 'camera')}</span><small>${time(r.duration)}</small></div><div class="record-info"><div class="record-line"><span class="status ${color}">${label}</span><span class="record-date">${esc(r.date)}</span></div><h3>${esc(craftCopy(r.title))}</h3><p>${r.simulated ? '模拟拍摄' : '真实本地录制'} <span>·</span> 1920 × 1080 <span>·</span> 有声</p><div class="record-bottom"><span>${r.status === 'approved' ? '演示收益' : r.status === 'local' ? '未上传至服务器' : r.status === 'review' ? '等待审核结果' : '等待模拟补传'}</span><b>${r.amount ? `+ ¥ ${money(r.amount)}` : '查看详情 →'}</b></div></div></button>`; }
function records() {
  const visible = state.records.filter(r => filter === '全部' || filter === '待处理' && ['review','cached','interrupted','local'].includes(r.status) || filter === '已采纳' && r.status === 'approved');
  return `<div class="page-heading"><div><span class="eyebrow">每一种手艺，都是专业经验</span><h1>拍摄记录<span class="lime-dot"></span></h1></div><span class="heading-count">${state.records.length} 条记录</span></div><div class="stats-row"><div><b>${state.records.length.toString().padStart(2,'0')}</b><span>累计拍摄</span></div><div><b>${state.records.filter(r=>r.status==='approved').length.toString().padStart(2,'0')}</b><span>模拟已采纳</span></div><div><b class="accent">¥ ${money(state.total)}</b><span>累计模拟收益</span></div></div><div class="record-toolbar"><div class="filter-tabs">${['全部','待处理','已采纳'].map(f=>`<button data-filter="${f}" class="${filter===f?'active':''}">${f}</button>`).join('')}</div><span>最近拍摄优先</span></div><div class="records-list">${visible.length ? visible.map(recordCard).join('') : `<div class="empty">${icon('film')}<h3>这里还没有采集记录</h3><p>和顾问说说你的拿手的手艺，开始下一次采集。</p><button class="primary" data-action="advisor">去发现拍摄机会 ${icon('arrow')}</button></div>`}</div><p class="page-footnote">示例图参考 V1，模拟记录不会上传服务器，真实录制文件仅保存在本浏览器。</p>`;
}
function profile() { const pending = state.settlements.some(s=>s.status==='pending'); return `<div class="page-heading"><div><span class="eyebrow">我的手艺 · 我的采集</span><h1>我的工作台<span class="lime-dot"></span></h1></div></div><div class="profile-layout"><section><div class="profile-intro"><div class="profile-avatar">${icon('user')}</div><div><h2>${esc(serverProfile?.name || `手艺人 ${phone.slice(-4)}`)}</h2><p>${phone.slice(0,3)} ${phone.slice(3,7)} ${phone.slice(7)} <span>· 演示账号</span></p></div><span class="creator-tag">手艺采集者</span></div><div class="balance-card"><div class="balance-top"><span>${icon('wallet')} 可结算余额</span><span>模拟收益</span></div><div class="balance-number"><small>¥</small> ${money(state.balance)}</div><p>把专业经验记录下来，让手艺走得更远。</p><div class="balance-bottom"><span>累计模拟收益 <b>¥ ${money(state.total)}</b></span><button data-action="settle" ${pending || state.balance<=0?'disabled':''}>${pending?'申请处理中':'全额结算'} ${icon('arrow')}</button></div></div><div class="section-title"><h3>结算申请</h3><span>${state.settlements.length} 条记录</span></div>${state.settlements.length ? state.settlements.map(s=>`<div class="settlement-row"><span class="settle-icon">${icon('wallet')}</span><div><b>全额结算申请</b><p>${esc(s.date)} · ${settlementStatusText(s)}</p>${s.note?`<p>处理备注：${esc(s.note)}</p>`:''}</div><strong>¥ ${money(s.amount)}</strong>${s.status==='pending'?`<button class="text-button" data-cancel-settle="${s.id}">撤销</button>`:''}</div>`).join('') : '<div class="subtle-empty">还没有结算申请，下一份回报在路上。</div>'}<div class="settlement-note">${icon('info')}<p>全额结算申请会同步到配套后台，由管理员线下联系并登记处理结果。当前均为演示金额，不会发起真实付款。</p></div></section><aside><div class="settings-list"><button data-action="spec">${icon('film')} 拍摄规范 ${icon('chevron')}</button><button data-action="support">${icon('headphones')} 联系与结算说明 ${icon('chevron')}</button><button data-action="about">${icon('info')} 关于 Spartan300 ${icon('chevron')}</button><button data-action="logout">${icon('user')} 退出登录 ${icon('chevron')}</button></div><div class="profile-signature">${icon('spark')}<p>让你的手艺，<br>成为机器人的真实经验。</p><span>SPARTAN300 / V0.1</span></div></aside></div>`; }
function addMessage(role,text,image) { state.messages.push({role,text,image}); save(); }
async function send(text) {
  if (!text.trim() || busy) return;
  addMessage('user',text.trim());
  if (state.permit) { state.permit = null; state.brief = []; addMessage('assistant','新的手艺会替换上一次未使用的授权。我们重新评估这次的操作手艺、工作场景和工具。'); }
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
    else { state.consultApproved=true;state.permit={id:uid(),title:state.brief[0].slice(0,28),brief:[...state.brief]}; addMessage('assistant','模拟查重与复杂度评估已通过：这次记录一种专业手艺的完整操作，供机器人学习操作经验。已生成针对双手、工具和关键判断的拍摄指导，以及 1 次拍摄授权。真实悬赏资格仍需正式审核。'); state.brief=[]; }
  }
  busy=false; save(); render();
}
function about() { modal('关于这个原型', `<div class="sheet-body"><span class="eyebrow accent">SPARTAN300 · V0.1</span><h3>记录专家手艺，为机器人训练积累经验。</h3><p>这是 Spartan300-V1 的简易采集版，沿用 V1 的 DeepReach 品牌、米白与陶土橙配色及专家采集示例图。目标是记录专家完成高技能手工劳动的完整操作、工具使用和关键判断。</p><p>已实现：本机账户登录与注册、三标签页面、单次拍摄授权、本地采集记录，以及可与 PC 后台同步的结算申请和用户管理。</p><p>真实设备录制：浏览器支持且处于 HTTPS 或 localhost 时，可调用摄像头与麦克风，按约 5 秒分片缓存到 IndexedDB，支持本地回放与导出。</p><p>AI 对话、外部评估、视频上传、审核和收益仍为模拟。用户与结算记录由本机服务保存，可在配套 PC 后台管理，不触发真实资金或自动联系。</p><p>局域网 HTTP 可完整测试交互和模拟拍摄；手机真实录制需要可信 HTTPS。账户与结算状态可通过本机服务跨设备同步；聊天与视频仍保存在各自浏览器，清理浏览器可能丢失这些本地数据。</p><button class="primary wide" data-action="close">知道了 ${icon('check')}</button></div>`); }
function spec() { modal('拍摄规范', `<div class="sheet-body"><div class="spec-grid"><span>画面规格<b>横屏 1920 × 1080</b></span><span>录制时长<b>最长 30 分钟</b></span><span>声音要求<b>必须开启麦克风</b></span><span>视频来源<b>仅现场录制</b></span></div><p>优先第一视角采集，双手、工具和工件持续可见。从准备、关键操作到完成结果，连续记录完整操作过程，边做边讲解专业判断。仅在获得许可的工作环境拍摄。</p><p>每次模拟评估通过只授权一条视频。开始录制即消耗授权；中途结束、设备故障或主动中止，都需要重新评估。</p><p>仅在录制前支持前后摄像头切换。录制中切换入口锁定。正式视频入口不接受相册文件。</p><p>真实录制在设备不支持 1920 × 1080 或没有音轨时会阻止开始。请保持页面在前台；锁屏、浏览器退出和系统中断不保证连续录制。</p><button class="primary wide" data-action="close">我了解了</button></div>`); }
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
  if(!state.permit) return toast('请先完成评估，获取一次拍摄授权');
  media={ mode:'sim',facing:'environment',stream:null,recorder:null,recording:false, seconds:0, start:0, chunks:0, queued:0, sent:0, offline:!navigator.onLine, id:uid(), writes:[], failure:false, title:state.permit.title, permitId:state.permit.id, ready:false };
  $('#overlay').innerHTML=`<div class="camera-modal" role="dialog" aria-modal="true" aria-label="拍摄工作台"><header class="camera-header"><button class="icon-button" data-action="exit-shoot" aria-label="返回顾问">${icon('back')}</button><span>拍摄工作台 <small>单条视频授权</small></span><span class="status green" id="shoot-mode-label">模拟拍摄</span></header><div class="camera-stage" id="camera-stage"><div class="camera-scene"></div><span class="camera-example-label">第一视角示例 · 非实时画面</span><video id="camera-video" muted autoplay playsinline></video><div class="camera-grid"><i></i><i></i></div><span class="camera-badge">1920 × 1080 · 16:9</span><span class="mic-badge">${icon('mic')} 录音必需</span><div class="camera-center" id="camera-center">${icon('camera')}<h3>准备记录一次完整操作</h3><p>V1 第一视角参考图 · 模拟画面，不调用摄像头</p></div><div class="camera-timer" id="camera-timer">00:00 <span>/ 30:00</span></div></div><div class="camera-controls"><div class="mode-switch"><button class="active" data-mode="sim">模拟拍摄</button><button data-mode="real">真实设备录制</button></div><div id="camera-notice" class="camera-notice">模拟分片、断网缓存和补传仅演示状态变化，不会发送视频。</div><div class="preflight" id="preflight"><label class="check-label"><input id="mic-confirm" type="checkbox"> 确认保留现场声音（模拟）</label><label class="check-label"><input id="landscape-confirm" type="checkbox"> 确认横屏拍摄 · 1920 × 1080</label></div><div class="upload-strip"><span id="network-label">${icon('wifi')} ${media.offline?'离线缓存演示':'模拟网络正常'}</span><span id="chunk-label">0 分片 · 等待开始</span><button class="text-button" data-action="network" id="network-button">模拟断网</button></div><div class="record-controls"><button class="control-side" data-action="switch-camera" id="switch-camera">${icon('rotate')}<span>后置摄像头</span></button><button class="record-button" id="record-button" data-action="record" aria-label="开始模拟录制"><span></span></button><span class="control-side limit">${icon('clock')}<span>最长 30 分钟</span></span></div><p class="record-hint" id="record-hint">点击开始后消耗本次授权 · 仅可录制一条视频</p></div></div>`;
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
function consumePermit() { if(!state.permit || state.permit.id!==media.permitId) throw Error('本次授权已失效，请重新评估'); state.permit=null; save(); }
function startRecording() {
  if(!media || media.recording) return;
  if(!$('#mic-confirm').checked || !$('#landscape-confirm').checked) return toast('请先确认录音和横屏拍摄要求');
  if(media.mode==='real') {
    if(!media.ready || !media.stream?.getAudioTracks().some(t=>t.readyState==='live' && t.enabled)) return toast('需要可用的 1080p 摄像头和真实麦克风才能开始');
    if(innerHeight>innerWidth) return toast('真实录制请先将设备横屏');
    if(!state.permit || state.permit.id!==media.permitId) return toast('本次授权已失效，请重新评估');
    try {
      const current=media; const preferred=['video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
      media.recorder=new MediaRecorder(media.stream,preferred?{mimeType:preferred}:{});
      media.recorder.ondataavailable=e=> { if(e.data.size){const idx=current.chunks++;const writing=storeChunk(current.id,idx,e.data).catch(()=>{current.failure=true;toast('本地存储写入失败，请导出已保存分片');if(current.recording) finishRecording();});current.writes.push(writing); if(media===current) updateRecordingUI();} };
      media.recorder.onerror=()=>{current.failure=true;finishRecording();};
      media.recorder.onstop=()=>finalizeRecording(current);
      media.recorder.start(5000); consumePermit();
    } catch(e) { return toast(`无法开始录制：${e.message}`); }
  } else { try { consumePermit(); } catch(e){return toast(e.message);} }
  media.recording=true; media.start=Date.now(); state.activeRecording={id:media.id,title:media.title,duration:0,chunks:0,simulated:media.mode==='sim'};save(); $('#camera-center').style.display='none'; $('#preflight').style.display='none'; $('#record-button').classList.add('recording'); $('#record-button').setAttribute('aria-label','结束录制'); $('#record-hint').textContent='正在录制 · 授权已使用 · 点击方块结束'; $('#switch-camera').disabled=true; document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=true); $('#camera-stage').classList.add('is-recording');
  media.timer=setInterval(()=>{ if(!media?.recording)return; media.seconds=Math.min(1800,Math.floor((Date.now()-media.start)/1000)); if(media.mode==='sim') {const n=Math.floor(media.seconds/5); while(media.chunks<n){media.chunks++;media.offline?media.queued++:media.sent++;}} updateRecordingUI(); if(media.seconds>=1800)finishRecording(); },250);
}
function updateRecordingUI() { if(!media || !$('#chunk-label')) return; if(state.activeRecording && state.activeRecording.chunks!==media.chunks){state.activeRecording.chunks=media.chunks;state.activeRecording.duration=media.seconds;save();} $('#camera-timer').innerHTML=`${time(media.seconds)} <span>/ 30:00</span>`; $('#chunk-label').textContent=media.mode==='real'?`${media.chunks} 个真实分片 · 仅本地缓存`:`${media.chunks} 分片 · 模拟已传 ${media.sent} · 待补 ${media.queued}`; $('#network-label').innerHTML=`${icon('wifi')} ${media.mode==='real'?'仅本地保存':media.offline?'模拟离线 · 缓存中':'模拟网络正常'}`; }
function finishRecording() { if(!media?.recording)return; media.recording=false;clearInterval(media.timer);media.seconds=Math.min(1800,Math.max(1,Math.floor((Date.now()-media.start)/1000))); $('#record-button').disabled=true; $('#record-hint').textContent='正在保存到本浏览器…'; if(media.mode==='real' && media.recorder?.state!=='inactive')media.recorder.stop();else finalizeRecording(media); }
async function finalizeRecording(current) {
  stopStream(); await Promise.all(current.writes);
  if(current.mode==='sim'){current.chunks=Math.max(1,Math.ceil(current.seconds/5));current.queued=current.offline?current.chunks:0;current.sent=current.offline?0:current.chunks;}
  const record={id:current.id,title:current.title,date:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),duration:current.seconds,status:current.failure?'interrupted':current.mode==='real'?'local':current.queued?'cached':'review',amount:0,simulated:current.mode==='sim',chunks:current.chunks,queued:current.queued};
  state.records.unshift(record); delete state.activeRecording;save();if(USE_SERVER && serverConnected)accountApi('/api/me/activity',{method:'POST',body:{recordCount:state.records.length}}).catch(()=>{}); media=null;closeModal();tab='records';render();showRecord(record.id);toast(record.simulated ? record.status==='review'?'模拟上传成功，请等待审核结果':record.status==='cached'?'模拟拍摄已保存，等待恢复后补传':'模拟录制已中断，请查看记录' : '录制已结束，分片保存在当前浏览器');
}
function exitShoot() { if(media?.recording){modalCannotExit();return;} stopStream(); media=null;closeModal();render(); }
function modalCannotExit(){toast('请先点击录制方块结束并保存；结束后需重新评估');}
async function showRecord(id) {
  const r=state.records.find(r=>r.id===id); if(!r)return;
  const [label,color]=statuses[r.status];
  modal('采集详情', `<div class="sheet-body"><div class="detail-cover"><img src="${coverFor(r)}" alt="手艺方向示例图"><span>${icon('film')}</span><b>${esc(craftCopy(r.title))}</b><small>${r.simulated?'模拟作品 · 无视频文件':'真实本地录制'}</small></div><span class="status ${color}">${label}</span><div class="spec-grid"><span>视频规格<b>1920 × 1080 · 横屏</b></span><span>时长 / 声音<b>${time(r.duration)} · ${r.simulated?'模拟有声':'含音轨'}</b></span><span>分片数<b>${r.chunks} 个 · ${r.simulated?'模拟':'真实本地缓存'}</b></span><span>${r.status==='review'?'收益状态':'演示收益'}<b>${r.status==='review'?'待审核':`¥ ${money(r.amount)}`}</b></span></div>${r.simulated?'<p class="notice">此记录为模拟数据，没有实际录制文件、服务器上传或真实审核。</p>':'<p class="notice">真实分片仅保存在本浏览器。未上传至服务器，未参加真实审核。结束后需重新评估才能再次拍摄。</p><div id="local-playback"><p>正在读取本地文件…</p></div>'}${r.status==='cached'?`<button class="primary wide" data-retry="${id}">模拟恢复网络并补传 ${icon('upload')}</button>`:''}${r.simulated && r.status==='review'?`<section class="upload-result" role="status"><span class="upload-result-icon">${icon('check')}</span><div><span class="upload-demo-label">上传流程演示</span><h3>拍摄上传成功</h3><p>请等待审核结果。</p></div></section><button class="primary wide" data-action="return-records">返回拍摄记录 ${icon('back')}</button>`:''}</div>`);
  if(!r.simulated) {try { const blob=await readMedia(id);const target=$('#local-playback');if(!target)return;if(blob){const url=URL.createObjectURL(blob);target.innerHTML=`<video controls playsinline src="${url}"></video><a class="primary wide" href="${url}" download="Spartan300-${id}.${blob.type.includes('mp4')?'mp4':'webm'}">导出本地视频 ${icon('upload')}</a>`;target.querySelector('video').addEventListener('emptied',()=>URL.revokeObjectURL(url),{once:true});}else target.innerHTML='<p>没有找到可播放分片，可能已被浏览器清理。</p>';}catch{$('#local-playback')?.replaceChildren(document.createTextNode('无法读取本地文件，请检查浏览器存储权限。'));}}
}
document.addEventListener('click', async e=> {
  const b=e.target.closest('button, [data-tab]'); if(!b || b.disabled)return;
  if(b.dataset.tab){tab=b.dataset.tab;render();window.scrollTo(0,0);return;}
  if(b.dataset.filter){filter=b.dataset.filter;render();return;}
  if(b.dataset.record){showRecord(b.dataset.record);return;}
  if(b.dataset.mode){chooseMode(b.dataset.mode);return;}
  if(b.dataset.retry){const r=state.records.find(r=>r.id===b.dataset.retry);if(r?.status==='cached' && r.simulated){r.status='review';r.queued=0;save();render();showRecord(r.id);toast('模拟补传成功，请等待审核结果');}return;}
  if(b.dataset.cancelSettle){if(USE_SERVER){await cancelServerSettlement(b.dataset.cancelSettle);return;}const s=state.settlements.find(s=>s.id===b.dataset.cancelSettle);if(s?.status==='pending'){s.status='cancelled';state.balance+=s.amount;save();render();toast('本地模拟申请已撤销，余额已恢复');}return;}
  switch(b.dataset.action){
    case 'auth-login':authMode='login';renderAuth();break;
    case 'auth-register':authMode='register';renderAuth();break;
    case 'close':closeModal();break;
    case 'return-records':closeModal();tab='records';filter='全部';render();break;
    case 'profile':tab='profile';render();break;
    case 'advisor':tab='advisor';render();break;
    case 'new-consult':if(!busy){write(`s300-last-consult-${phone}`,{messages:state.messages,brief:state.brief,permit:state.permit});state.messages=[];state.brief=[];state.permit=null;state.consultApproved=false;save();render();window.scrollTo(0,0);}break;
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
if(phone && accounts[phone])load();render();
if(USE_SERVER){connectAccount();setInterval(()=>{if(phone && tab==='profile')refreshAccount();},5000);}
