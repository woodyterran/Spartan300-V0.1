const $ = (selector, parent = document) => parent.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const paths = {
  grid:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
  wallet:'M3 6h17v14H3zM3 6V3h14v3m0 6h4v4h-4z',
  users:'M16 21v-2a6 6 0 0 0-12 0v2M14 3a4 4 0 0 1 0 8m6 10v-2a6 6 0 0 0-4-5M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
  log:'M7 3h10l3 3v15H4V3zm1 6h8m-8 4h8m-8 4h5',
  search:'M21 21l-5-5m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow:'M5 12h14m-5-5 5 5-5 5',
  back:'m14 6-6 6 6 6',
  refresh:'M20 8a8 8 0 1 0 1 7M20 3v5h-5',
  close:'m6 6 12 12M6 18 18 6',
  check:'m5 12 4 4L19 6',
  info:'M12 11v6m0-10h.01m9 5a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6zm-4 10 3 3 5-6',
  download:'M12 3v13m-5-5 5 5 5-5M3 16v5h18v-5',
  plus:'M12 5v14M5 12h14',
  logout:'M9 3H3v18h6m6-15 6 6-6 6M8 12h13',
  clock:'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  external:'M14 3h7v7m0-7L10 14M9 3H3v18h18v-6',
  chevron:'m9 6 6 6-6 6',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.info}"/></svg>`;
const money = value => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits:2, maximumFractionDigits:2 });
const date = (value, full = false) => value ? new Date(value).toLocaleString('zh-CN', { timeZone:'Asia/Shanghai', year:full ? 'numeric' : undefined, month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }) : '—';
const statusLabels = { open:'可领取',claimed:'独占中',submitted:'待审核',completed:'已完成',pending:'待处理', paid:'已登记付款', cancelled:'用户已撤销', rejected:'已退回', active:'正常', disabled:'已停用' };
const badge = status => `<span class="badge ${esc(status)}">${statusLabels[status] || esc(status)}</span>`;
let snapshot = null, page = 'overview', pageNumber = 1, drawer = null, dialog = null, loading = false;
const filters = { settlements:{status:'pending',query:''}, users:{status:'all',query:''}, bounties:{status:'all',query:''} };
const pageNames = { overview:'工作台总览', settlements:'结算申请', users:'用户管理', bounties:'悬赏管理', logs:'操作记录' };
const pageSize = 8;
async function api(url, options = {}) {
  let response;
  try { response = await fetch(url, { credentials:'same-origin', ...options, headers:{'Content-Type':'application/json',...options.headers}, body: options.body === undefined ? undefined : JSON.stringify(options.body) }); }
  catch { throw new Error('无法连接本机服务，请确认开发服务器仍在运行'); }
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || '操作失败，请稍后重试'); error.status=response.status; throw error; }
  return result;
}
function toast(text) { const element=$('#admin-toast');element.textContent=text;element.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove('show'),3500); }
function person(user, showSkill = false) { return `<div class="person-cell"><span class="person-avatar">${esc(user.name?.replace('（演示）','').slice(0,1) || '手')}</span><div><strong>${esc(user.name)}</strong><small>${showSkill ? esc(user.skill) : esc(user.phone)}</small></div></div>`; }
function renderLogin(error = '') {
  $('#admin-overlay').innerHTML='';
  $('#admin-app').innerHTML=`<div class="login-screen"><section class="login-story"><div class="login-brand"><img src="/assets/deepreach-logo.png" alt="DeepReach"><span>SPARTAN300 · 结算管理后台</span></div><h1>让每一份手艺的回报，<br><span>被妥善交付。</span></h1><p>从申请、联系到线下结算登记，<br>在同一个工作台里，有序处理每一份回报。</p><small>EXPERT SKILLS. REAL-WORLD VALUE.</small></section><section class="login-panel"><div class="login-card"><span class="eyebrow">DEEPREACH / OPERATIONS</span><h2>管理员登录</h2><p>欢迎回到 Spartan300 结算工作台。</p><form id="admin-login-form"><div class="form-group"><label for="admin-username">管理员账号</label><input id="admin-username" name="username" value="admin" autocomplete="username" required></div><div class="form-group"><label for="admin-password">密码</label><input id="admin-password" name="password" type="password" value="spartan300-admin" autocomplete="current-password" required></div><p class="form-error" role="alert">${esc(error)}</p><button class="primary wide" type="submit">登录管理后台 ${icon('arrow')}</button></form><div class="login-note">本地演示账号：admin<br>演示密码：spartan300-admin<br>用户与结算状态保存在这台 Mac，不触发真实付款。</div><p class="login-footnote">SPARTAN300 V0.1 · PC 结算管理后台<br><a href="/" target="_blank" rel="noopener">打开手机采集端 ↗</a></p></div></section></div>`;
}
function render() {
  if (!snapshot) return;
  const scroll=$('.admin-main')?.scrollTop || 0;
  $('#admin-app').innerHTML=`<div class="admin-shell"><aside class="sidebar"><div class="sidebar-brand"><img src="/assets/deepreach-logo.png" alt="DeepReach"><span>SPARTAN300 · 结算管理</span></div><div class="sidebar-section">运营工作台</div><nav class="side-nav" aria-label="后台导航">${[['overview','grid','工作台总览'],['settlements','wallet','结算申请'],['users','users','用户管理'],['bounties','clock','悬赏管理'],['logs','log','操作记录']].map(([id,name,label])=>`<button data-page="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(name)}<span>${label}</span>${id==='settlements'&&snapshot.stats.pendingCount?`<small>${snapshot.stats.pendingCount}</small>`:''}</button>`).join('')}</nav><div class="sidebar-foot"><div class="local-indicator"><i></i> 本机数据服务已连接<br>仅用于演示结算流程</div><div class="admin-identity"><span class="avatar">AD</span><div><strong>演示管理员</strong><small>Administrator</small></div><button class="icon-button" data-action="logout" aria-label="退出后台">${icon('logout')}</button></div></div></aside><header class="admin-topbar"><div class="breadcrumb"><span>Spartan300</span><span>/</span><b>${pageNames[page]}</b></div><div class="topbar-actions"><span class="demo-pill">本地演示</span><button class="icon-button" data-action="refresh" aria-label="刷新后台数据" ${loading?'disabled':''}>${icon('refresh')}</button><a href="/" target="_blank" rel="noopener">打开采集端 ${icon('external')}</a></div></header><main class="admin-main"><div class="main-inner">${page==='overview'?overview():page==='settlements'?settlementsPage():page==='users'?usersPage():page==='bounties'?bountiesPage():logsPage()}<div class="admin-footnote">Spartan300 V0.1 · 本机演示数据 · 线下付款登记不会发起真实转账</div></div></main></div><div class="mobile-admin-note">当前为 PC 管理后台，请使用电脑查看。</div>`;
  $('.admin-main').scrollTop=scroll;
  renderOverlay();
}
function heading(title, subtitle, eyebrow, actions = '') { return `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`; }
function stat(label, value, note, name, color = '') { return `<article class="stat-card"><div class="stat-heading"><span>${label}</span><span class="stat-icon">${icon(name)}</span></div><b class="stat-number ${color} money">${value}</b><span class="stat-note">${note}</span></article>`; }
function overview() {
  const stats=snapshot.stats, pending=snapshot.settlements.filter(s=>s.status==='pending');
  return `${heading('工作台总览','查看待处理结算与用户动态，妥善跟进每一份回报。','OPERATIONS OVERVIEW',`<span class="date-label">${new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'long',day:'numeric',weekday:'long'})}</span>`)}<section class="welcome-card"><div><span class="eyebrow">每一份手艺，都值得认真对待</span><h2>把手艺的价值，交到手艺人手中。</h2><p>今天有 <b>${pending.length}</b> 笔申请待处理。联系用户并在线下完成付款后，及时登记结果。</p></div><button class="primary" data-page="settlements">查看待处理申请 ${icon('arrow')}</button></section><div class="stat-grid">${stat('待结算申请金额',`¥ ${money(stats.pendingAmount)}`,`<b>${stats.pendingCount} 笔</b> 申请等待管理员处理`,'wallet','accent')}${stat('累计已结算（演示）',`¥ ${money(stats.paidAmount)}`,`已登记 ${stats.paidCount} 笔 · 含历史演示余额`,'check','green')}${stat('用户总数',stats.userCount,`${stats.activeCount} 位正常用户 · ${stats.userCount-stats.activeCount} 位已停用`,'users')}${stat('用户可结算余额',`¥ ${money(stats.availableAmount)}`,'尚未提交申请的演示余额','clock')}</div><div class="dashboard-grid"><div><section class="panel"><div class="panel-heading"><h2>待处理结算 <span>${pending.length} 笔</span></h2><button class="text-button" data-page="settlements">查看全部 →</button></div>${pending.length?`<div class="table-wrap"><table><thead><tr><th>申请用户</th><th>申请金额</th><th>申请时间</th><th>操作</th></tr></thead><tbody>${pending.slice(0,5).map(s=>`<tr><td>${person(s.user)}</td><td><span class="money">¥ ${money(s.amount)}</span></td><td>${date(s.createdAt)}</td><td><button class="text-button" data-settlement="${s.id}">查看详情</button></td></tr>`).join('')}</tbody></table></div>`:empty('没有待处理申请','新的结算申请会显示在这里。')}</section><section class="panel"><div class="panel-heading"><h2>近 7 日结算登记</h2><span class="small muted">单位：元 · 演示</span></div><div class="panel-body">${paymentChart()}</div></section></div><div><section class="panel"><div class="panel-heading"><h2>结算处理流程</h2></div><div class="panel-body"><div class="mini-flow"><div><b>${stats.pendingCount}</b><span>待联系 / 付款</span></div>${icon('arrow')}<div><b>${stats.paidCount}</b><span>已登记付款</span></div></div><div class="process-note">${icon('shield')}<div><b>先线下确认，再登记结果</b><p>本后台用于管理用户与结算申请。付款由管理员线下联系处理，网页只登记处理结果。</p></div></div></div></section><section class="panel"><div class="panel-heading"><h2>最近操作</h2><button class="text-button" data-page="logs">全部记录 →</button></div><div class="panel-body"><div class="activity-list">${snapshot.audit.slice(0,5).map(a=>`<div class="activity-item"><i class="activity-dot"></i><div><b>${esc(a.action)}</b><p>${esc(a.detail || a.target)}</p><time>${date(a.at)} · ${esc(a.actor)}</time></div></div>`).join('')}</div></div></section></div></div>`;
}
function paymentChart() {
  const days=Array.from({length:7},(_,i)=>{const at=new Date(Date.now()-(6-i)*86400000);const key=at.toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});return {label:at.toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit'}),amount:snapshot.settlements.filter(s=>s.status==='paid'&&s.paidAt&&new Date(s.paidAt).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'})===key).reduce((a,s)=>a+s.amount,0)};});
  const max=Math.max(...days.map(d=>d.amount),1);
  return `<div class="chart">${days.map(d=>`<div class="chart-column"><b>${d.amount?money(d.amount):'—'}</b><i class="chart-bar" style="height:${Math.max(3,d.amount/max*95)}px"></i><small>${d.label}</small></div>`).join('')}</div><p class="chart-note">仅统计后台登记的演示付款结果，不代表真实资金流水。</p>`;
}
function empty(title, text) { return `<div class="empty">${icon('wallet')}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`; }
function filterItems(kind) {
  const filter=filters[kind], q=filter.query.toLowerCase().trim();
  if(kind==='bounties')return (snapshot.bounties || []).filter(t=>(filter.status==='all'||t.status===filter.status)&&(!q||`${t.title} ${t.owner?.name || ''} ${t.owner?.phone || ''}`.toLowerCase().includes(q)));
  const items=kind==='users'?snapshot.users:snapshot.settlements;
  return items.filter(item=>{
    const statusMatch=filter.status==='all'||filter.status==='returned'&&['rejected','cancelled'].includes(item.status)||item.status===filter.status;
    const haystack=kind==='users'?`${item.name} ${item.phone} ${item.skill}`:`${item.id} ${item.user.name} ${item.user.phone} ${item.contact}`;
    return statusMatch&&(!q||haystack.toLowerCase().includes(q));
  });
}
function filtersBar(kind) {
  const list=kind==='settlements'?[['pending','待处理'],['paid','已登记付款'],['returned','已退回 / 撤销'],['all','全部申请']]:[['all','全部用户'],['active','正常'],['disabled','已停用']];
  return `<div class="filter-panel"><div class="filter-tabs">${list.map(([id,label])=>{const count=(kind==='users'?snapshot.users:snapshot.settlements).filter(s=>id==='all'||id==='returned'&&['rejected','cancelled'].includes(s.status)||s.status===id).length;return `<button class="${filters[kind].status===id?'active':''}" data-filter-kind="${kind}" data-status="${id}">${label}<small>${count}</small></button>`;}).join('')}</div><div class="search-field">${icon('search')}<input id="admin-search" data-search-kind="${kind}" value="${esc(filters[kind].query)}" placeholder="${kind==='users'?'搜索姓名、手机号或手艺':'搜索编号、手机号或用户'}" aria-label="${kind==='users'?'搜索用户':'搜索结算申请'}" autocomplete="off"></div></div>`;
}
function pagination(total) {
  const pages=Math.max(1,Math.ceil(total/pageSize));pageNumber=Math.min(pageNumber,pages);
  return `<div class="pagination"><span>共 ${total} 条记录 · 每页 ${pageSize} 条</span><div class="page-controls"><button data-page-step="-1" ${pageNumber<=1?'disabled':''} aria-label="上一页">‹</button><b>${pageNumber}</b><span>/ ${pages}</span><button data-page-step="1" ${pageNumber>=pages?'disabled':''} aria-label="下一页">›</button></div></div>`;
}
function settlementsPage() {
  const items=filterItems('settlements');pageNumber=Math.min(pageNumber,Math.max(1,Math.ceil(items.length/pageSize)));const visible=items.slice((pageNumber-1)*pageSize,pageNumber*pageSize);
  return `${heading('结算申请','全额结算申请集中处理。管理员线下联系付款，完成后登记结果。','SETTLEMENT MANAGEMENT',`<button class="secondary" data-export="settlements">${icon('download')} 导出当前列表</button>`)}${filtersBar('settlements')}<section class="panel">${items.length?`<div class="table-wrap"><table><thead><tr><th>申请编号 / 时间</th><th>申请用户</th><th>联系手机号</th><th>申请金额</th><th>状态</th><th>操作</th></tr></thead><tbody>${visible.map(s=>`<tr><td class="id-cell">${esc(s.id)}<small>${date(s.createdAt,true)}</small></td><td>${person(s.user)}</td><td>${esc(s.contact)}</td><td><span class="money">¥ ${money(s.amount)}</span></td><td>${badge(s.status)}</td><td><div class="actions-cell"><button class="text-button" data-settlement="${s.id}">查看详情</button>${s.status==='pending'?`<button class="text-button green" data-pay="${s.id}">登记付款</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>${pagination(items.length)}`:empty('没有符合条件的结算申请','可以切换状态或调整搜索关键词。')}</section><div class="data-notice">${icon('info')}<span>页面金额均为演示。登记付款仅更新本机记录，不会调用银行、微信或支付宝。手机端申请同步到这里，用户可在处理前撤销。</span></div>`;
}
function bountiesPage() {
  const items=filterItems('bounties');pageNumber=Math.min(pageNumber,Math.max(1,Math.ceil(items.length/pageSize)));const visible=items.slice((pageNumber-1)*pageSize,pageNumber*pageSize);
  const claims=(snapshot.bountyClaims || []).slice().sort((a,b)=>b.claimedAt.localeCompare(a.claimedAt));
  return `${heading('悬赏管理','跟进 6 小时独占窗口、模拟提交与审核。到期未提交或判失败后，任务重新向所有用户开放。','BOUNTY MANAGEMENT')}<div class="filter-panel"><div class="filter-tabs">${[['all','全部'],['open','可领取'],['claimed','独占中'],['submitted','待审核'],['completed','已完成']].map(([id,label])=>`<button class="${filters.bounties.status===id?'active':''}" data-filter-kind="bounties" data-status="${id}">${label}</button>`).join('')}</div><div class="search-field">${icon('search')}<input id="admin-search" data-search-kind="bounties" value="${esc(filters.bounties.query)}" placeholder="搜索任务、用户或手机号" aria-label="搜索悬赏"></div></div><section class="panel">${visible.length?`<div class="table-wrap"><table><thead><tr><th>悬赏任务</th><th>当前领取人</th><th>状态</th><th>独占截止时间</th><th>操作</th></tr></thead><tbody>${visible.map(t=>`<tr><td><strong>${esc(t.title)}</strong><small class="bounty-id">${esc(t.id)}</small></td><td>${t.owner?person(t.owner):'向所有用户开放'}</td><td>${badge(t.status)}</td><td>${date(t.expiresAt,true)}${t.status==='submitted'?'<small class="bounty-id">已按时提交 · 等待审核不自动释放</small>':''}</td><td><div class="actions-cell">${['claimed','submitted'].includes(t.status)?`<button class="text-button" data-bounty-review="${t.claimId}" data-review-action="fail">判失败并释放</button>`:''}${t.status==='submitted'?`<button class="text-button green" data-bounty-review="${t.claimId}" data-review-action="approve">模拟审核通过</button>`:''}${['open','completed'].includes(t.status)?'—':''}</div></td></tr>`).join('')}</tbody></table></div>${pagination(items.length)}`:empty('没有符合条件的悬赏','用户完成评估并领取后，悬赏会显示在这里。')}</section><div class="data-notice">${icon('info')}<span>独占权和状态由本机服务管理，重拍不延长截止时间。本页只有模拟提交信息，没有收到视频文件，不会执行真实视频审核或自动计入收益。任务按标准化标题识别，不具备 AI 同义手艺查重。</span></div><section class="panel bounty-history"><div class="panel-heading"><h2>领取与提交记录 · ${claims.length} 次</h2></div>${claims.length?`<div class="table-wrap"><table><thead><tr><th>悬赏 / 用户</th><th>领取时间 / 截止时间</th><th>领取结果</th><th>模拟提交信息 / 审核原因</th></tr></thead><tbody>${claims.map(c=>{const user=snapshot.users.find(u=>u.id===c.userId);return `<tr><td>${esc(c.title)}<small class="bounty-id">${esc(user?.name)} · ${esc(user?.phone)}</small></td><td>${date(c.claimedAt,true)}<small class="bounty-id">${date(c.expiresAt,true)}</small></td><td>${({active:'独占中',submitted:'已提交待审核',failed:'判失败，已释放',expired:'到期未提交，已释放',approved:'模拟审核通过'})[c.status] || esc(c.status)}</td><td>${c.submission?`${c.submission.duration} 秒 · ${c.submission.chunks} 个分片（仅信息）<small class="bounty-id">${date(c.submission.submittedAt,true)}</small>`:'尚未提交'}${c.reviewNote?`<small class="bounty-id">${esc(c.reviewNote)}</small>`:''}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="panel-body muted">暂无领取记录。</div>'}</section>`;
}

function usersPage() {
  const items=filterItems('users');pageNumber=Math.min(pageNumber,Math.max(1,Math.ceil(items.length/pageSize)));const visible=items.slice((pageNumber-1)*pageSize,pageNumber*pageSize);
  return `${heading('用户管理','查看手艺人账户、结算余额与申请记录，管理账户状态和联系信息。','USER MANAGEMENT',`<button class="secondary" data-export="users">${icon('download')} 导出用户</button><button class="primary" data-action="new-user">${icon('plus')} 新增用户</button>`)}${filtersBar('users')}<section class="panel">${items.length?`<div class="table-wrap"><table><thead><tr><th>用户</th><th>手艺方向</th><th>可结算余额</th><th>待结算</th><th>账户状态</th><th>操作</th></tr></thead><tbody>${visible.map(u=>`<tr><td>${person(u)}</td><td>${esc(u.skill || '待补充')}</td><td><span class="money">¥ ${money(u.balance)}</span></td><td>¥ ${money(u.pending)}</td><td>${badge(u.status)}</td><td><div class="actions-cell"><button class="text-button" data-user="${u.id}">查看详情</button><button class="text-button ${u.status==='disabled'?'green':''}" data-user-status="${u.id}">${u.status==='active'?'停用':'启用'}</button></div></td></tr>`).join('')}</tbody></table></div>${pagination(items.length)}`:empty('没有符合条件的用户','请调整关键词，或新增一个演示用户。')}</section><div class="data-notice">${icon('info')}<span>停用后，用户将不能登录或发起新结算。已有结算记录继续保留，管理员仍可处理待结算申请。</span></div>`;
}
function logsPage() { return `${heading('操作记录','保留用户申请、撤销与管理员处理记录，方便追溯每一次状态变更。','ACTIVITY LOG')}<section class="panel"><div class="table-wrap"><table class="logs-table"><thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>关联对象</th><th>说明</th></tr></thead><tbody>${snapshot.audit.map(a=>`<tr><td>${date(a.at,true)}</td><td>${esc(a.actor)}</td><td class="log-action">${esc(a.action)}</td><td class="id-cell">${esc(a.target)}</td><td>${esc(a.detail || '—')}</td></tr>`).join('')}</tbody></table></div></section>`; }
function openDrawer(kind,id) { drawer={kind,id};dialog=null;renderOverlay(); }
function renderOverlay() { $('#admin-overlay').innerHTML=`${drawer?drawer.kind==='settlement'?settlementDrawer():userDrawer():''}${dialog?dialogMarkup():''}`; }
function settlementDrawer() {
  const item=snapshot.settlements.find(s=>s.id===drawer.id);if(!item){drawer=null;return '';}
  const logs=snapshot.audit.filter(a=>a.target===item.id).slice(0,8);
  return `<div class="overlay"><section class="drawer" role="dialog" aria-modal="true" aria-label="结算申请详情"><header class="drawer-head"><div><h2>结算申请详情</h2><small>${esc(item.id)}</small></div><button class="icon-button" data-action="close-drawer" aria-label="关闭详情">${icon('close')}</button></header><div class="drawer-body"><div class="drawer-person">${person(item.user)}${badge(item.status)}</div><div class="amount-box ${item.status==='paid'?'green':''}"><span>全额结算申请 · 演示金额</span><b class="money">¥ ${money(item.amount)}</b></div><dl class="detail-grid"><div><dt>联系手机号</dt><dd>${esc(item.contact)}</dd></div><div><dt>微信号</dt><dd>${esc(item.wechat || '未填写')}</dd></div><div><dt>手艺方向</dt><dd>${esc(item.user.skill || '待补充')}</dd></div><div><dt>申请时间</dt><dd>${date(item.createdAt,true)}</dd></div><div><dt>数据来源</dt><dd>${item.source==='seed-example'?'预置演示样例':item.source==='legacy-demo-import'?'旧版浏览器演示数据':'手机端申请'}</dd></div><div><dt>用户状态</dt><dd>${statusLabels[item.user.status]}</dd></div>${item.paidAt?`<div><dt>登记付款时间</dt><dd>${date(item.paidAt,true)}</dd></div>`:''}${item.reference?`<div><dt>线下登记编号</dt><dd>${esc(item.reference)}</dd></div>`:''}</dl>${item.note?`<h3 class="drawer-section-title">处理备注</h3><div class="plain-note">${esc(item.note)}</div>`:''}<h3 class="drawer-section-title">处理说明</h3><div class="plain-note">${item.status==='pending'?'请根据用户填写的手机号或微信号线下联系，确认信息与付款安排。完成线下付款后，再登记处理结果；如需补充信息，可填写原因退回申请。':item.status==='paid'?'此申请已登记为线下付款完成，不能重复登记。本地演示不包含真实转账。':item.status==='rejected'?'此申请已退回，演示余额已恢复到用户账户，用户可补充信息后再次发起全额结算。':'此申请由用户撤销，演示余额已恢复。'}</div><h3 class="drawer-section-title">处理记录</h3><div class="timeline"><div class="timeline-item"><i></i><div><b>用户提交全额结算申请</b><p>${date(item.createdAt,true)} · ¥ ${money(item.amount)}</p></div></div>${logs.map(a=>`<div class="timeline-item"><i></i><div><b>${esc(a.action)}</b><p>${date(a.at,true)} · ${esc(a.actor)}<br>${esc(a.detail)}</p></div></div>`).join('')}</div></div><footer class="drawer-footer"><button class="secondary" data-action="close-drawer">关闭</button>${item.status==='pending'?`<button class="secondary" data-reject="${item.id}">退回申请</button><button class="primary" data-pay="${item.id}">登记线下已付款 ${icon('check')}</button>`:''}</footer></section></div>`;
}
function userDrawer() {
  const user=snapshot.users.find(u=>u.id===drawer.id);if(!user){drawer=null;return '';}
  const records=snapshot.settlements.filter(s=>s.userId===user.id);
  return `<div class="overlay"><section class="drawer" role="dialog" aria-modal="true" aria-label="用户详情"><header class="drawer-head"><div><h2>用户详情</h2><small>${esc(user.id)}</small></div><button class="icon-button" data-action="close-drawer" aria-label="关闭详情">${icon('close')}</button></header><div class="drawer-body"><div class="drawer-person">${person(user)}${badge(user.status)}</div><div class="user-wallet"><div><span>可结算余额</span><b class="money">¥ ${money(user.balance)}</b></div><div><span>待结算金额</span><b class="money">¥ ${money(user.pending)}</b></div><div><span>累计模拟收益</span><b class="money">¥ ${money(user.total)}</b></div><div><span>累计已结算（含历史）</span><b class="money">¥ ${money(user.paid)}</b></div></div><h3 class="drawer-section-title">用户资料</h3><form id="edit-user-form" data-user-id="${user.id}"><div class="form-grid"><div class="form-group"><label for="edit-name">用户姓名 / 称呼</label><input id="edit-name" name="name" value="${esc(user.name)}" maxlength="40" required></div><div class="form-group"><label>登录手机号</label><input value="${esc(user.phone)}" readonly></div></div><div class="form-group"><label for="edit-skill">手艺方向</label><input id="edit-skill" name="skill" value="${esc(user.skill)}" maxlength="80"></div><div class="form-group"><label for="edit-note">管理员备注</label><textarea id="edit-note" name="note" maxlength="300" placeholder="例如联系进度、资料补充说明">${esc(user.note)}</textarea></div><div class="form-error" role="alert"></div><button class="primary" type="submit">保存用户资料 ${icon('check')}</button></form><dl class="detail-grid"><div><dt>注册时间</dt><dd>${date(user.createdAt,true)}</dd></div><div><dt>最近登录</dt><dd>${date(user.lastLogin,true)}</dd></div><div><dt>采集记录数</dt><dd>${user.recordCount} 条 · 本地上报</dd></div><div><dt>账户来源</dt><dd>${user.source==='seed-example'?'预置演示用户':user.source==='legacy-demo-import'?'旧版演示账户导入':user.source==='admin-created-demo'?'管理员创建':'采集端演示账户'}</dd></div></dl><h3 class="drawer-section-title">结算申请 · ${records.length} 条</h3>${records.length?records.map(s=>`<div class="small-settlement"><div><b>¥ ${money(s.amount)}</b><p>${date(s.createdAt)}</p></div>${badge(s.status)}<button class="text-button" data-settlement="${s.id}">详情 →</button></div>`).join(''):'<div class="plain-note">该用户暂未发起结算申请。</div>'}</div><footer class="drawer-footer"><button class="secondary" data-action="close-drawer">关闭</button><button class="${user.status==='active'?'danger':'primary'}" data-user-status="${user.id}">${user.status==='active'?'停用账户':'启用账户'}</button></footer></section></div>`;
}
function dialogMarkup() {
  let title='',content='';
  if(dialog.kind==='bounty-review') {
    const claim=(snapshot.bountyClaims || []).find(c=>c.id===dialog.id);if(!claim)return '';
    const fail=dialog.action==='fail';title=fail?'悬赏判失败并释放':'模拟审核通过';content=`<form id="bounty-review-form" data-id="${esc(claim.id)}" data-decision="${dialog.action}"><p><strong>${esc(claim.title)}</strong></p><p class="plain-note">${fail?'此轮领取将结束，任务立即重新向所有用户开放；原用户不能继续提交此轮视频。':'仅演示审核结果；任务将标为已完成，此处不会自动计入收益。'} 当前未收到视频文件，均为审核流程演示。</p><div class="form-group"><label for="bounty-review-note">审核原因</label><textarea id="bounty-review-note" name="note" maxlength="300" required></textarea></div><p class="form-error" role="alert"></p><div class="modal-actions"><button class="secondary" type="button" data-action="close-dialog">取消</button><button class="${fail?'danger':'primary'}" type="submit">${fail?'确认判失败并释放':'确认模拟通过'}</button></div></form>`;
  } else if(dialog.kind==='paid'||dialog.kind==='reject') {
    const item=snapshot.settlements.find(s=>s.id===dialog.id);if(!item)return '';
    const isPaid=dialog.kind==='paid';title=isPaid?'登记线下已付款':'退回结算申请';
    content=`<form id="decision-form" data-id="${item.id}" data-decision="${dialog.kind}"><div class="amount-box ${isPaid?'green':''}"><span>${esc(item.user.name)} · ${esc(item.user.phone)}</span><b>¥ ${money(item.amount)}</b></div><p class="plain-note">${isPaid?'本操作仅登记线下付款结果，不会转账。当前是本地演示，金额不代表真实资金。':'退回后，申请金额将恢复到用户的可结算余额；请填写明确原因，用户可在手机端查看。'}</p>${isPaid?'<div class="form-group"><label for="payment-ref">线下登记编号（选填）</label><input id="payment-ref" name="reference" maxlength="80" placeholder="便于线下核对的记录编号"></div>':''}<div class="form-group"><label for="decision-note">${isPaid?'处理备注（选填）':'退回原因'}</label><textarea id="decision-note" name="note" maxlength="300" placeholder="${isPaid?'填写联系与登记说明':'例如：联系信息需补充，请更新微信号后重新申请'}" ${isPaid?'':'required'}></textarea></div>${isPaid?'<label class="check-label"><input type="checkbox" name="confirmed" required>确认以演示方式登记线下付款结果，本操作不会发起真实支付。</label>':''}<p class="form-error" role="alert"></p><div class="modal-actions"><button class="secondary" type="button" data-action="close-dialog">取消</button><button class="${isPaid?'primary':'danger'}" type="submit">${isPaid?'确认登记':'确认退回'}</button></div></form>`;
  } else if(dialog.kind==='user-status') {
    const user=snapshot.users.find(u=>u.id===dialog.id);if(!user)return '';
    const disable=user.status==='active';title=disable?'停用用户账户':'启用用户账户';content=`<form id="user-status-form" data-id="${user.id}" data-status="${disable?'disabled':'active'}"><p>${esc(user.name)} · ${esc(user.phone)}</p><div class="plain-note">${disable?'停用后，用户无法登录或提交新结算。已有申请与历史记录保留，仍可在后台处理。':'启用后，用户可以重新登录采集端并发起结算申请。'}</div><div class="form-group" style="margin-top:20px"><label for="status-note">管理员备注（选填）</label><textarea id="status-note" name="note" maxlength="300" placeholder="填写状态调整的原因">${esc(user.note)}</textarea></div><p class="form-error" role="alert"></p><div class="modal-actions"><button class="secondary" type="button" data-action="close-dialog">取消</button><button class="${disable?'danger':'primary'}" type="submit">确认${disable?'停用':'启用'}</button></div></form>`;
  } else {
    title='新增演示用户';content=`<form id="create-user-form"><p class="plain-note">创建后可使用手机号与演示密码登录采集端。新用户初始余额为 0，不会发送短信。</p><div class="form-grid"><div class="form-group"><label for="new-user-name">姓名 / 称呼</label><input id="new-user-name" name="name" maxlength="40" placeholder="例如：王师傅" required></div><div class="form-group"><label for="new-user-phone">手机号</label><input id="new-user-phone" name="phone" type="tel" pattern="1[3-9][0-9]{9}" maxlength="11" required></div></div><div class="form-group"><label for="new-user-skill">手艺方向</label><input id="new-user-skill" name="skill" maxlength="80" placeholder="例如：木工 · 榫卯修配"></div><div class="form-group"><label for="new-user-password">演示密码</label><input id="new-user-password" name="password" type="password" minlength="6" maxlength="64" value="spartan300" required><span class="hint">至少 6 位，请勿使用真实密码。</span></div><div class="form-group"><label for="new-user-note">管理员备注（选填）</label><textarea id="new-user-note" name="note" maxlength="300"></textarea></div><p class="form-error" role="alert"></p><div class="modal-actions"><button class="secondary" type="button" data-action="close-dialog">取消</button><button class="primary" type="submit">创建用户</button></div></form>`;
  }
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><header class="modal-head"><h2>${title}</h2><button class="icon-button" data-action="close-dialog" aria-label="关闭确认窗口">${icon('close')}</button></header><div class="modal-body">${content}</div></section></div>`;
}
async function refresh({ silent = false } = {}) {
  if(loading)return;
  loading=true;
  try { snapshot=await api('/api/admin/snapshot');render();if(!silent)toast('后台数据已刷新'); }
  catch(error) { if(error.status===401){snapshot=null;drawer=null;dialog=null;renderLogin();}else if(!snapshot)$('#admin-app').innerHTML=`<div class="loading"><section class="error-panel"><h2>暂时无法读取后台数据</h2><p>${esc(error.message)}</p><button class="primary" data-action="refresh">重新连接</button></section></div>`;else if(!silent)toast(error.message); }
  finally {loading=false;const button=$('[data-action="refresh"]');if(button)button.disabled=false;}
}
function download(kind) {
  const items=filterItems(kind), protect=value=>{let text=String(value??'');if(/^[=+\-@\t\r]/.test(text))text="'"+text;return `"${text.replaceAll('"','""')}"`;};
  const rows=kind==='users'?[['用户编号','姓名','手机号','手艺','账户状态','可结算余额（演示）','待结算（演示）','累计已结算（演示）','备注'],...items.map(u=>[u.id,u.name,u.phone,u.skill,statusLabels[u.status],money(u.balance),money(u.pending),money(u.paid),u.note])]:[['申请编号','用户','手机号','联系手机号','微信号','申请金额（演示）','状态','申请时间','登记付款时间','线下登记编号','备注'],...items.map(s=>[s.id,s.user.name,s.user.phone,s.contact,s.wechat,money(s.amount),statusLabels[s.status],date(s.createdAt,true),date(s.paidAt,true),s.reference,s.note])];
  const blob=new Blob(['\ufeff'+rows.map(r=>r.map(protect).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`Spartan300-${kind==='users'?'用户':'结算申请'}-${new Date(Date.now()+8*3600000).toISOString().slice(0,10)}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`已导出当前筛选的 ${items.length} 条记录`);
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  try {
    if(button.dataset.page){page=button.dataset.page;pageNumber=1;render();$('.admin-main').scrollTop=0;return;}
    if(button.dataset.filterKind){filters[button.dataset.filterKind].status=button.dataset.status;pageNumber=1;render();return;}
    if(button.dataset.pageStep){pageNumber+=Number(button.dataset.pageStep);render();return;}
    if(button.dataset.settlement){openDrawer('settlement',button.dataset.settlement);return;}
    if(button.dataset.user){openDrawer('user',button.dataset.user);return;}
    if(button.dataset.bountyReview){dialog={kind:'bounty-review',id:button.dataset.bountyReview,action:button.dataset.reviewAction};renderOverlay();return;}
    if(button.dataset.pay){dialog={kind:'paid',id:button.dataset.pay};renderOverlay();return;}
    if(button.dataset.reject){dialog={kind:'reject',id:button.dataset.reject};renderOverlay();return;}
    if(button.dataset.userStatus){dialog={kind:'user-status',id:button.dataset.userStatus};renderOverlay();return;}
    if(button.dataset.export){download(button.dataset.export);return;}
    switch(button.dataset.action){
      case 'refresh':await refresh();break;
      case 'logout':await api('/api/admin/logout',{method:'POST',body:{}});snapshot=null;drawer=null;dialog=null;renderLogin();break;
      case 'new-user':dialog={kind:'create-user'};renderOverlay();break;
      case 'close-drawer':drawer=null;renderOverlay();break;
      case 'close-dialog':dialog=null;renderOverlay();break;
    }
  }catch(error){toast(error.message);}
});
document.addEventListener('input',event=>{
  const kind=event.target.dataset.searchKind;if(!kind)return;
  const cursor=event.target.selectionStart;filters[kind].query=event.target.value;pageNumber=1;render();const input=$('#admin-search');input.focus();input.setSelectionRange(cursor,cursor);
});
document.addEventListener('submit',async event=>{
  const form=event.target;event.preventDefault();const data=new FormData(form);const button=$('button[type="submit"]',form);if(button?.disabled)return;if(button)button.disabled=true;
  const errorBox=$('.form-error',form);if(errorBox)errorBox.textContent='';
  try {
    if(form.id==='admin-login-form'){await api('/api/admin/login',{method:'POST',body:{username:data.get('username'),password:data.get('password')}});await refresh({silent:true});return;}
    if(form.id==='bounty-review-form'){await api(`/api/admin/bounties/${encodeURIComponent(form.dataset.id)}/review`,{method:'POST',body:{action:form.dataset.decision,note:data.get('note')}});dialog=null;await refresh({silent:true});toast(form.dataset.decision==='fail'?'悬赏已释放，所有用户可重新领取':'已记录模拟审核通过');return;}
    if(form.id==='decision-form'){await api(`/api/admin/settlements/${form.dataset.id}/decision`,{method:'POST',body:{action:form.dataset.decision,note:data.get('note'),reference:data.get('reference'),confirmed:data.get('confirmed')==='on'}});dialog=null;await refresh({silent:true});toast(form.dataset.decision==='paid'?'已登记演示付款结果，未发起真实转账':'申请已退回，演示余额已恢复');return;}
    if(form.id==='user-status-form'){await api(`/api/admin/users/${form.dataset.id}`,{method:'PATCH',body:{status:form.dataset.status,note:data.get('note')}});dialog=null;await refresh({silent:true});toast(form.dataset.status==='disabled'?'账户已停用，历史记录已保留':'账户已启用');return;}
    if(form.id==='edit-user-form'){await api(`/api/admin/users/${form.dataset.userId}`,{method:'PATCH',body:{name:data.get('name'),skill:data.get('skill'),note:data.get('note')}});await refresh({silent:true});toast('用户资料已保存');return;}
    if(form.id==='create-user-form'){await api('/api/admin/users',{method:'POST',body:{name:data.get('name'),phone:data.get('phone'),skill:data.get('skill'),password:data.get('password'),note:data.get('note')}});dialog=null;page='users';filters.users={status:'all',query:data.get('phone')};pageNumber=1;await refresh({silent:true});toast('演示用户已创建，可登录采集端');}
  }catch(error){if(errorBox&&errorBox.isConnected)errorBox.textContent=error.message;else toast(error.message);}
  finally {if(button?.isConnected)button.disabled=false;}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(dialog)dialog=null;else drawer=null;renderOverlay();}});
$('#admin-app').innerHTML='<div class="loading">正在连接本机结算工作台…</div>';
await refresh({silent:true});
setInterval(()=>{if(snapshot&&!drawer&&!dialog&&document.visibilityState==='visible'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))refresh({silent:true});},15000);
