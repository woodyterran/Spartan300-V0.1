import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { createBounties } from './bounties.mjs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const LEGACY_HASH = text => { let n = 2166136261; for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0).toString(16); };
const passwordRecord = password => { const salt = randomBytes(16).toString('hex'); return { salt, hash: scryptSync(password, salt, 64).toString('hex') }; };
const passwordMatches = (password, record) => Boolean(record && timingSafeEqual(scryptSync(password, record.salt, 64), Buffer.from(record.hash, 'hex')));
const PHONE = /^1[3-9]\d{9}$/;
const clean = (value, max = 300) => String(value ?? '').trim().slice(0, max);
const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
const cents = value => { const number = Number(value); if (!Number.isFinite(number) || number < 0 || number > 1000000 || Math.abs(number * 100 - Math.round(number * 100)) > .00001) fail(400, '金额格式不正确'); return Math.round(number * 100); };
const yuan = value => value / 100;
const id = prefix => `${prefix}${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
const iso = () => new Date().toISOString();
function newUser(phone, name, skill, password, extra = {}) {
  return { id: id('U'), phone, name, skill, status: 'active', createdAt: iso(), lastLogin: null, note: '', source: 'registered-demo', balanceCents: 0, totalEarnedCents: 0, totalPaidCents: 0, recordCount: 0, legacyImported: true, seedSamples: false, password: password ? passwordRecord(password) : null, ...extra };
}
function seedDatabase() {
  const database = { version: 1, users: [], settlements: [], audit: [] };
  const ago = hours => new Date(Date.now() - hours * 3600000).toISOString();
  database.users.push(newUser('13800138000', '手艺人 8000', '专业手艺', 'spartan300', { source: 'demo-account', balanceCents: 40000, totalEarnedCents: 40000, recordCount: 3, legacyImported: false, legacyDigest: LEGACY_HASH('spartan300'), seedSamples: true, createdAt: ago(72) }));
  const people = [
    ['18600001001', '张师傅（演示）', '木工 · 榫卯修配', 800, 1200, 400, 'pending', 26, 2],
    ['13900001002', '刘师傅（演示）', '电气 · 连接器装配', 800, 800, 0, 'pending', 20, 5],
    ['13700001003', '陈师傅（演示）', '厨艺 · 精细刀工', 600, 600, 0, 'pending', 11, 20],
    ['13600001004', '赵师傅（演示）', '皮具 · 手工缝制', 200, 400, 200, 'available', 8, 28],
    ['13500001005', '林师傅（演示）', '园艺 · 修剪嫁接', 400, 400, 400, 'paid', 6, 52],
  ];
  for (const [phone, name, skill, amount, earned, paid, status, count, hours] of people) {
    const user = newUser(phone, name, skill, 'spartan300', { source: 'seed-example', balanceCents: status === 'available' ? amount * 100 : 0, totalEarnedCents: earned * 100, totalPaidCents: paid * 100, recordCount: count, status: phone === '13600001004' ? 'disabled' : 'active', createdAt: ago(200 + hours), lastLogin: ago(hours) });
    database.users.push(user);
    if (paid > 0 && status !== 'paid') database.settlements.push({ id:id('ST'), userId:user.id, amountCents:paid*100, status:'paid', contact:phone, wechat:`demo_${phone.slice(-4)}`, createdAt:ago(hours+48), updatedAt:ago(hours+47), paidAt:ago(hours+47), note:'预置历史演示记录，未发生真实付款', reference:`DEMO-HISTORY-${phone.slice(-4)}`, source:'seed-example' });
    if (status === 'pending' || status === 'paid') database.settlements.push({ id: id('ST'), userId: user.id, amountCents: amount * 100, status, contact: phone, wechat: `demo_${phone.slice(-4)}`, createdAt: ago(hours), updatedAt: ago(hours), paidAt: status === 'paid' ? ago(hours - 1) : null, note: status === 'paid' ? '预置演示记录，未发生真实付款' : '', reference: status === 'paid' ? 'DEMO-001' : '', source: 'seed-example' });
  }
  database.audit.push({ id: randomUUID(), at: iso(), actor: '系统', action: '初始化本地演示数据', target: '系统', detail: '所有金额与账户均为演示，不触发真实付款' });
  return database;
}

export async function createBackend({ dataPath, adminPassword = process.env.SPARTAN_ADMIN_PASSWORD || 'spartan300-admin', now = Date.now }) {
  let database;
  try { database = JSON.parse(await readFile(dataPath, 'utf8')); if (database.version !== 1 || !Array.isArray(database.users) || !Array.isArray(database.settlements) || !Array.isArray(database.audit)) throw new Error('本地数据文件格式不正确，原文件已保留'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; database = seedDatabase(); await mkdir(path.dirname(dataPath), { recursive: true }); await writeFile(dataPath, JSON.stringify(database, null, 2), { mode: 0o600 }); }
  database.bounties ||= []; database.bountyClaims ||= [];
  let queue = Promise.resolve();
  const sessions = new Map();
  const adminSecret = passwordRecord(adminPassword);
  const loginAttempts = new Map();
  const audit = (db, actor, action, target, detail = '') => db.audit.unshift({ id: randomUUID(), at: iso(), actor, action, target, detail });
  const transact = fn => {
    const operation = queue.then(async () => {
      const next = structuredClone(database);
      const result = fn(next);
      const temporary = `${dataPath}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
      await rename(temporary, dataPath);
      database = next;
      return result;
    });
    queue = operation.catch(() => {});
    return operation;
  };
  const bounties = createBounties({ getDatabase: () => database, transact, audit, now });
  const publicUser = user => {
    const { password, legacyDigest, ...rest } = user;
    return { ...rest, balance: yuan(user.balanceCents), total: yuan(user.totalEarnedCents), pending: yuan(database.settlements.filter(s => s.userId === user.id && s.status === 'pending').reduce((a, s) => a + s.amountCents, 0)), paid: yuan(user.totalPaidCents) };
  };
  const publicSettlement = item => ({ ...item, amount: yuan(item.amountCents), date: new Date(item.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) });
  const wallet = user => ({ balance: yuan(user.balanceCents), total: yuan(user.totalEarnedCents), paid: yuan(user.totalPaidCents), settlements: database.settlements.filter(s => s.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicSettlement) });
  const userResult = user => ({ user: publicUser(user), wallet: wallet(user) });
  const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(item => item.trim().split('=').map(decodeURIComponent)).filter(p => p.length === 2));
  const sessionFor = (req, role) => {
    const token = cookies(req)[role === 'admin' ? 's300_admin_session' : 's300_user_session'];
    const session = sessions.get(token);
    if (!session || session.role !== role || session.expires < Date.now()) fail(401, '请重新登录');
    if (role === 'user') { const user = database.users.find(u => u.id === session.userId); if (!user || user.status !== 'active') fail(403, '此账户已停用，请联系管理员'); return user; }
    return session;
  };
  const startSession = (res, role, userId) => { const token = randomBytes(32).toString('base64url'); sessions.set(token, { role, userId, expires: Date.now() + 12 * 3600000 }); res.setHeader('Set-Cookie', `${role === 'admin' ? 's300_admin_session' : 's300_user_session'}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`); };
  const logout = (req, res, role) => { const name = role === 'admin' ? 's300_admin_session' : 's300_user_session'; sessions.delete(cookies(req)[name]); res.setHeader('Set-Cookie', `${name}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`); };
  const readBody = async req => {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail(415, '请使用 JSON 请求');
    const hostname = new URL(`http://${req.headers.host}`).hostname;
    if (!/^(localhost|127\.0\.0\.1|\[::1\]|10\.[\d.]+|192\.168\.[\d.]+|172\.(1[6-9]|2\d|3[01])\.[\d.]+)$/.test(hostname)) fail(403, '仅支持本机或局域网访问');
    const origin = req.headers.origin;
    if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) fail(403, '请求来源不匹配');
    let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 524288) fail(413, '请求内容过大'); }
    try { return JSON.parse(raw || '{}'); } catch { fail(400, '请求格式不正确'); }
  };
  const limitLogin = req => { const key = req.socket.remoteAddress; const now = Date.now(); let entry = loginAttempts.get(key); if (!entry || entry.until < now) { entry = { count: 0, until: now + 15 * 60000 }; loginAttempts.set(key, entry); } if (++entry.count > 60) fail(429, '尝试次数过多，请稍后再试'); };
  const importLegacy = (db, user, legacy) => {
    if (user.legacyImported) return;
    if (!legacy || typeof legacy !== 'object') { user.legacyImported = true; return; }
    const available = cents(legacy.balance ?? 0);
    const items = Array.isArray(legacy.settlements) ? legacy.settlements.slice(0, 200) : [];
    let pending = 0, paid = 0;
    for (const item of items) {
      if (!['pending', 'paid', 'cancelled', 'rejected'].includes(item.status)) continue;
      const amount = cents(item.amount);
      if (!amount || item.status === 'pending' && pending) continue;
      const createdAt = Number.isFinite(Date.parse(item.createdAt || item.date)) ? new Date(item.createdAt || item.date).toISOString() : iso();
      db.settlements.push({ id: `LEG-${createHash('sha256').update(`${user.id}:${item.id}`).digest('hex').slice(0, 12).toUpperCase()}`, userId: user.id, amountCents: amount, status: item.status, contact: PHONE.test(item.contact || '') ? item.contact : user.phone, wechat: clean(item.wechat, 50), createdAt, updatedAt: createdAt, paidAt: item.status === 'paid' ? createdAt : null, note: clean(item.note) || '由旧版浏览器演示数据导入', reference: '', source: 'legacy-demo-import' });
      if (item.status === 'pending') pending += amount;
      if (item.status === 'paid') paid += amount;
    }
    user.balanceCents = available;
    user.totalEarnedCents = Math.max(cents(legacy.total ?? 0), available + pending + paid);
    user.totalPaidCents = Math.max(paid, user.totalEarnedCents - available - pending);
    user.recordCount = Math.max(0, Math.min(10000, Math.floor(Number(legacy.recordCount) || 0)));
    user.legacyImported = true;
    audit(db, '系统', '导入旧版演示数据', user.phone, '仅首次导入；此后结算数据以本机服务器为准');
  };
  const adminSnapshot = () => {
    const users = database.users.map(publicUser);
    const settlements = database.settlements.map(s => ({ ...publicSettlement(s), user: users.find(u => u.id === s.userId) }));
    const pending = settlements.filter(s => s.status === 'pending');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
    return { demo: true, updatedAt: iso(), ...bounties.adminSnapshot(), users, settlements: settlements.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), audit: database.audit.slice(0, 300), stats: { userCount: users.length, activeCount: users.filter(u => u.status === 'active').length, pendingCount: pending.length, pendingAmount: pending.reduce((a, s) => a + s.amount, 0), paidAmount: users.reduce((a, u) => a + u.paid, 0), paidCount: settlements.filter(s => s.status === 'paid').length, availableAmount: users.reduce((a, u) => a + u.balance, 0), todayCount: settlements.filter(s => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(s.createdAt)) === today).length } };
  };

  return {
    async handle(req, res, url) {
      if (!url.pathname.startsWith('/api/') || url.pathname === '/api/health') return false;
      try {
        const route = url.pathname;
        const method = req.method;
        if (route === '/api/admin/snapshot' || route.includes('/bounties')) await bounties.expire();
        if (method === 'POST' && route === '/api/admin/login') {
          limitLogin(req); const body = await readBody(req);
          if (body.username !== 'admin' || !passwordMatches(String(body.password || ''), adminSecret)) fail(401, '管理员账号或密码不正确');
          startSession(res, 'admin', 'admin'); send(res, 200, { admin: { name: '演示管理员', username: 'admin' } }); return true;
        }
        if (method === 'POST' && route === '/api/admin/logout') { await readBody(req); logout(req, res, 'admin'); send(res, 200, { ok: true }); return true; }
        if (route.startsWith('/api/admin/')) {
          sessionFor(req, 'admin');
          const bountyReview = route.match(/^\/api\/admin\/bounties\/([^/]+)\/review$/);
          if (method === 'POST' && bountyReview) { send(res, 200, await bounties.review(bountyReview[1], await readBody(req))); return true; }
          if (method === 'GET' && route === '/api/admin/snapshot') { send(res, 200, adminSnapshot()); return true; }
          if (method === 'POST' && route === '/api/admin/users') {
            const body = await readBody(req); const phone = clean(body.phone, 11), password = String(body.password || '');
            if (!PHONE.test(phone) || password.length < 6 || password.length > 64) fail(400, '请填写有效手机号与 6–64 位演示密码');
            const user = await transact(db => { if (db.users.some(u => u.phone === phone)) fail(409, '此手机号已存在'); const user = newUser(phone, clean(body.name, 40) || `手艺人 ${phone.slice(-4)}`, clean(body.skill, 80) || '待补充', password, { source: 'admin-created-demo', note: clean(body.note) }); db.users.push(user); audit(db, '管理员', '新增用户', phone, user.name); return user; });
            send(res, 201, { user: publicUser(user) }); return true;
          }
          const userMatch = route.match(/^\/api\/admin\/users\/([^/]+)$/);
          if (method === 'PATCH' && userMatch) {
            const body = await readBody(req); const user = await transact(db => { const user = db.users.find(u => u.id === userMatch[1]); if (!user) fail(404, '用户不存在'); if (body.status !== undefined) { if (!['active', 'disabled'].includes(body.status)) fail(400, '账户状态不正确'); user.status = body.status; } if (body.name !== undefined) user.name = clean(body.name, 40) || user.name; if (body.skill !== undefined) user.skill = clean(body.skill, 80); if (body.note !== undefined) user.note = clean(body.note); audit(db, '管理员', '更新用户', user.phone, `${user.status === 'active' ? '正常' : '已停用'} · ${user.note || user.name}`); return user; }); send(res, 200, { user: publicUser(user) }); return true;
          }
          const decisionMatch = route.match(/^\/api\/admin\/settlements\/([^/]+)\/decision$/);
          if (method === 'POST' && decisionMatch) {
            const body = await readBody(req); if (!['paid', 'reject'].includes(body.action)) fail(400, '处理方式不正确'); if (body.action === 'paid' && body.confirmed !== true) fail(400, '请确认已在线下完成付款'); if (body.action === 'reject' && !clean(body.note)) fail(400, '请填写退回原因');
            const settlement = await transact(db => { const item = db.settlements.find(s => s.id === decisionMatch[1]); if (!item) fail(404, '结算申请不存在'); if (item.status !== 'pending') fail(409, '申请状态已变化，请刷新后处理'); const user = db.users.find(u => u.id === item.userId); item.status = body.action === 'paid' ? 'paid' : 'rejected'; item.updatedAt = iso(); item.note = clean(body.note); item.reference = clean(body.reference, 80); if (item.status === 'paid') { item.paidAt = item.updatedAt; user.totalPaidCents += item.amountCents; } else user.balanceCents += item.amountCents; audit(db, '管理员', item.status === 'paid' ? '登记线下已付款（演示）' : '退回结算申请', item.id, `${user.phone} · ¥${yuan(item.amountCents).toFixed(2)} · ${item.note || item.reference || '本地登记，不触发真实付款'}`); return item; });
            send(res, 200, { settlement: publicSettlement(settlement) }); return true;
          }
          fail(404, '接口不存在');
        }
        if (method === 'POST' && ['/api/auth/login', '/api/auth/register', '/api/auth/restore'].includes(route)) {
          limitLogin(req); const body = await readBody(req); const phone = clean(body.phone, 11), password = String(body.password || ''); if (!PHONE.test(phone)) fail(400, '请输入有效手机号');
          let user;
          if (route.endsWith('/register')) {
            if (password.length < 6 || password.length > 64) fail(400, '演示密码需要 6–64 位');
            user = await transact(db => { if (db.users.some(u => u.phone === phone)) fail(409, '此手机号已注册，请登录'); const user = newUser(phone, `手艺人 ${phone.slice(-4)}`, '待补充', password); db.users.push(user); audit(db, '用户', '注册演示账户', phone); return user; });
          } else if (route.endsWith('/restore')) {
            const digest = clean(body.legacyDigest, 8); if (!/^[0-9a-f]{1,8}$/.test(digest) || !body.legacy) fail(401, '请重新登录');
            user = await transact(db => { let user = db.users.find(u => u.phone === phone); if (user) { if (user.status !== 'active') fail(403, '此账户已停用，请联系管理员'); if (user.legacyImported || user.legacyDigest !== digest) fail(401, '请重新登录'); } else { user = newUser(phone, `手艺人 ${phone.slice(-4)}`, '待补充', null, { source: 'legacy-demo-import', legacyImported: false, legacyDigest: digest }); db.users.push(user); } importLegacy(db, user, body.legacy); user.lastLogin = iso(); return user; });
          } else {
            user = await transact(db => { const user = db.users.find(u => u.phone === phone); if (!user || !(user.password ? passwordMatches(password, user.password) : user.legacyDigest === LEGACY_HASH(password))) fail(401, '手机号或密码不正确'); if (user.status !== 'active') fail(403, '此账户已停用，请联系管理员'); if (!user.password) user.password = passwordRecord(password); importLegacy(db, user, body.legacy); user.lastLogin = iso(); return user; });
          }
          startSession(res, 'user', user.id); send(res, 200, userResult(user)); return true;
        }
        if (method === 'POST' && route === '/api/auth/logout') { await readBody(req); logout(req, res, 'user'); send(res, 200, { ok: true }); return true; }
        if (route.startsWith('/api/me')) {
          const current = sessionFor(req, 'user');
          if (method === 'GET' && route === '/api/me/bounties') { send(res, 200, bounties.snapshot(current.id)); return true; }
          if (method === 'POST' && route === '/api/me/bounties/claim') { send(res, 200, await bounties.claim(current.id, await readBody(req))); return true; }
          const bountyAction = route.match(/^\/api\/me\/bounties\/([^/]+)\/(start|submit)$/);
          if (method === 'POST' && bountyAction) { const body = await readBody(req); send(res, 200, bountyAction[2] === 'start' ? await bounties.start(current.id, bountyAction[1]) : await bounties.submit(current.id, bountyAction[1], body)); return true; }
          if (method === 'GET' && route === '/api/me') { send(res, 200, userResult(current)); return true; }
          if (method === 'POST' && route === '/api/me/activity') {
            const body = await readBody(req); await transact(db => { db.users.find(u => u.id === current.id).recordCount = Math.max(0, Math.min(10000, Math.floor(Number(body.recordCount) || 0))); }); send(res, 200, { ok: true }); return true;
          }
          if (method === 'POST' && route === '/api/me/settlements') {
            const body = await readBody(req); const contact = clean(body.contact, 11); if (!PHONE.test(contact)) fail(400, '请填写有效的联系手机号');
            const item = await transact(db => { const user = db.users.find(u => u.id === current.id); if (user.status !== 'active') fail(403, '账户已停用'); if (db.settlements.some(s => s.userId === user.id && s.status === 'pending')) fail(409, '已有待处理申请，请勿重复提交'); if (user.balanceCents <= 0) fail(409, '当前没有可结算余额'); if (body.expectedAmount !== undefined && cents(body.expectedAmount) !== user.balanceCents) fail(409, '余额已更新，请确认最新金额后重新申请'); const item = { id: id('ST'), userId: user.id, amountCents: user.balanceCents, status: 'pending', contact, wechat: clean(body.wechat, 50), createdAt: iso(), updatedAt: iso(), paidAt: null, note: '', reference: '', source: 'mobile-demo' }; user.balanceCents = 0; db.settlements.push(item); audit(db, '用户', '申请全额结算', item.id, `${user.phone} · ¥${yuan(item.amountCents).toFixed(2)}`); return item; });
            send(res, 201, { settlement: publicSettlement(item), ...userResult(database.users.find(u => u.id === current.id)) }); return true;
          }
          const cancelMatch = route.match(/^\/api\/me\/settlements\/([^/]+)\/cancel$/);
          if (method === 'POST' && cancelMatch) {
            await readBody(req); await transact(db => { const item = db.settlements.find(s => s.id === cancelMatch[1] && s.userId === current.id); if (!item) fail(404, '申请不存在'); if (item.status !== 'pending') fail(409, '申请已处理，无法撤销'); item.status = 'cancelled'; item.updatedAt = iso(); db.users.find(u => u.id === current.id).balanceCents += item.amountCents; audit(db, '用户', '撤销结算申请', item.id, current.phone); }); send(res, 200, userResult(database.users.find(u => u.id === current.id))); return true;
          }
          fail(404, '接口不存在');
        }
        fail(404, '接口不存在');
      } catch (error) { send(res, error.status || 500, { error: error.status ? error.message : '本地数据保存失败，请稍后重试' }); }
      return true;
    },
  };
}
