import { createHash, randomUUID } from 'node:crypto';

export const BOUNTY_WINDOW_MS = 6 * 60 * 60 * 1000;
const reject = (status, message) => { const error = new Error(message); error.status = status; throw error; };
const text = (value, max = 300) => String(value ?? '').trim().slice(0, max);
const titleKey = value => value.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');

// Only task ownership and submission metadata reach this server. No video is uploaded.
export function createBounties({ getDatabase, transact, audit, now = Date.now }) {
  const stamp = () => new Date(now()).toISOString();
  const currentClaim = (db, task) => db.bountyClaims.find(c => c.id === task.claimId);
  const release = (task, at) => Object.assign(task, { status: 'open', ownerId: null, claimId: null, claimedAt: null, expiresAt: null, updatedAt: at });
  const expireIn = db => {
    for (const task of db.bounties) {
      if (task.status !== 'claimed' || Date.parse(task.expiresAt) > now()) continue;
      const claim = currentClaim(db, task), at = stamp();
      if (claim) { claim.status = 'expired'; claim.updatedAt = at; }
      release(task, at);
      audit(db, '系统', '悬赏到期释放', task.id, '6 小时内未成功提交，已重新向所有用户开放');
    }
  };
  const expire = async () => {
    if (getDatabase().bounties.some(t => t.status === 'claimed' && Date.parse(t.expiresAt) <= now())) await transact(expireIn);
  };
  const taskView = (task, userId) => ({ id: task.id, title: task.title, status: task.status, mine: task.ownerId === userId, claimedAt: task.claimedAt, expiresAt: task.expiresAt, updatedAt: task.updatedAt });
  const claimView = claim => ({ ...claim, title: getDatabase().bounties.find(t => t.id === claim.bountyId)?.title || claim.title });
  const snapshot = userId => ({ serverNow: now(), bounties: getDatabase().bounties.map(t => taskView(t, userId)), claims: getDatabase().bountyClaims.filter(c => c.userId === userId).map(claimView).sort((a, b) => b.claimedAt.localeCompare(a.claimedAt)) });
  const active = (db, claimId, userId) => {
    const claim = db.bountyClaims.find(c => c.id === claimId && c.userId === userId);
    if (!claim) reject(404, '没有找到你的悬赏领取记录');
    const task = db.bounties.find(t => t.id === claim.bountyId);
    if (claim.status !== 'active' || Date.parse(claim.expiresAt) <= now() || task.claimId !== claim.id || task.ownerId !== userId) reject(409, '独占窗口已结束或任务已提交，请刷新悬赏状态');
    if (db.users.find(u => u.id === userId)?.status !== 'active') reject(403, '账户已停用');
    return { claim, task };
  };
  return {
    expire,
    snapshot,
    adminSnapshot() {
      const db = getDatabase();
      return { bounties: db.bounties.map(t => ({ ...t, owner: db.users.find(u => u.id === t.ownerId) ? { name: db.users.find(u => u.id === t.ownerId).name, phone: db.users.find(u => u.id === t.ownerId).phone } : null })), bountyClaims: db.bountyClaims.map(claimView) };
    },
    async claim(userId, body) {
      await expire();
      await transact(db => {
        expireIn(db);
        if (db.users.find(u => u.id === userId)?.status !== 'active') reject(403, '账户已停用');
        const title = text(body.title, 160), key = titleKey(title);
        if (!body.bountyId && key.length < 2) reject(400, '请填写具体手艺名称');
        let task = body.bountyId ? db.bounties.find(t => t.id === body.bountyId) : db.bounties.find(t => t.key === key);
        if (body.bountyId && !task) reject(404, '悬赏任务不存在');
        if (!task) { task = { id: `B-${createHash('sha256').update(key).digest('hex').slice(0, 16)}`, key, title, status: 'open', ownerId: null, claimId: null, createdAt: stamp(), updatedAt: stamp() }; db.bounties.push(task); }
        if (task.status === 'claimed' && task.ownerId === userId) return;
        if (task.status !== 'open') reject(409, task.status === 'claimed' ? '此悬赏正在其他用户的 6 小时独占窗口内' : task.status === 'submitted' ? '此悬赏已提交，正在等待审核结果' : '此悬赏已经完成');
        const claim = { id: `C-${randomUUID()}`, bountyId: task.id, userId, title: task.title, brief: Array.isArray(body.brief) ? body.brief.slice(0, 3).map(v => text(v, 1000)) : [], status: 'active', claimedAt: stamp(), expiresAt: new Date(now() + BOUNTY_WINDOW_MS).toISOString(), updatedAt: stamp(), submission: null, reviewNote: '' };
        db.bountyClaims.push(claim);
        Object.assign(task, { status: 'claimed', ownerId: userId, claimId: claim.id, claimedAt: claim.claimedAt, expiresAt: claim.expiresAt, updatedAt: claim.claimedAt });
        audit(db, '用户', '领取悬赏 · 独占 6 小时', task.id, `${db.users.find(u => u.id === userId).phone} · ${task.title}`);
      });
      return snapshot(userId);
    },
    async start(userId, claimId) {
      await expire();
      await transact(db => { expireIn(db); active(db, claimId, userId); });
      return snapshot(userId);
    },
    async submit(userId, claimId, body) {
      await expire();
      await transact(db => {
        expireIn(db);
        const previous = db.bountyClaims.find(c => c.id === claimId && c.userId === userId);
        if (previous?.status === 'submitted' && previous.submission?.recordId === body.recordId) return;
        const { claim, task } = active(db, claimId, userId);
        const duration = Number(body.duration), chunks = Number(body.chunks);
        if (!text(body.recordId, 100) || !Number.isFinite(duration) || duration < 1 || duration > 1800 || !Number.isInteger(chunks) || chunks < 1 || chunks > 10000) reject(400, '采集记录信息不完整');
        claim.submission = { recordId: text(body.recordId, 100), duration, chunks, simulated: body.simulated !== false, submittedAt: stamp(), metadataOnly: true };
        claim.status = 'submitted'; claim.updatedAt = stamp(); task.status = 'submitted'; task.updatedAt = stamp();
        audit(db, '用户', '提交审核流程（模拟）', task.id, '仅接收记录信息，未接收视频文件；按时提交后等待后台审核');
      });
      return snapshot(userId);
    },
    async review(claimId, body) {
      await expire();
      if (!['fail', 'approve'].includes(body.action) || !text(body.note)) reject(400, '请选择审核结果并填写原因');
      await transact(db => {
        expireIn(db);
        const claim = db.bountyClaims.find(c => c.id === claimId);
        if (!claim) reject(404, '领取记录不存在');
        const task = db.bounties.find(t => t.id === claim.bountyId);
        if (task.claimId !== claim.id || !['active', 'submitted'].includes(claim.status)) reject(409, '该次领取已结束，不能处理新一轮领取');
        if (body.action === 'approve' && claim.status !== 'submitted') reject(409, '任务尚未提交，不能审核通过');
        claim.reviewNote = text(body.note); claim.reviewedAt = stamp(); claim.updatedAt = stamp(); claim.status = body.action === 'fail' ? 'failed' : 'approved';
        if (body.action === 'fail') release(task, stamp()); else { task.status = 'completed'; task.updatedAt = stamp(); }
        audit(db, '管理员', body.action === 'fail' ? '悬赏判失败并释放（演示）' : '悬赏审核通过（演示）', task.id, claim.reviewNote);
      });
      return { ok: true };
    },
  };
}
