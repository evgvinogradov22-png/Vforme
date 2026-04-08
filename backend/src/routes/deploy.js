const router = require('express').Router();
const { execFile } = require('child_process');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const DeployHistory = require('../models/DeployHistory');
const User = require('../models/User');

const A = [auth, role('admin', 'superadmin')];
const DEPLOY_SCRIPT = '/var/www/deploy.sh';

function run(args) {
  return new Promise((resolve, reject) => {
    execFile('/bin/bash', [DEPLOY_SCRIPT, ...args], { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

function checkHealth(port) {
  return new Promise(resolve => {
    const http = require('http');
    const req = http.get(`http://localhost:${port}/api/health`, res => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

async function saveHistory({ env, action, desc, status, output, errorMsg, userId }) {
  try {
    const user = userId ? await User.findByPk(userId, { attributes: ['name', 'email'] }) : null;
    await DeployHistory.create({
      env, action, desc, status,
      output: (output || '').slice(-4000),
      errorMsg: (errorMsg || '').slice(0, 2000),
      userId: userId || null,
      userName: user?.name || null,
      userEmail: user?.email || null,
    });
  } catch (e) { console.error('Deploy history save failed:', e.message); }
}

// GET статус серверов
router.get('/status', A, async (req, res) => {
  try {
    const [prod, test] = await Promise.all([checkHealth(3001), checkHealth(3002)]);
    res.json({ prod, test });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET история деплоев
router.get('/versions', A, async (req, res) => {
  try {
    const rows = await DeployHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100,
      attributes: ['id', 'env', 'action', 'desc', 'status', 'errorMsg', 'userName', 'userEmail', 'createdAt'],
    });
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET детали одного деплоя с output
router.get('/versions/:id', A, async (req, res) => {
  try {
    const row = await DeployHistory.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Не найдено' });
    res.json(row);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST деплой на тест
router.post('/deploy', A, async (req, res) => {
  const { desc } = req.body;
  if (!desc) return res.status(400).json({ error: 'Введи описание' });
  const safeDesc = String(desc).slice(0, 300).replace(/[^a-zA-Zа-яёА-ЯЁ0-9 .,!?()_\-\n]/g, '');
  try {
    const output = await run(['deploy', safeDesc]);
    await saveHistory({ env: 'test', action: 'deploy', desc: safeDesc, status: 'ok', output, userId: req.user.id });
    res.json({ ok: true, output });
  } catch(e) {
    await saveHistory({ env: 'test', action: 'deploy', desc: safeDesc, status: 'error', errorMsg: e.message, userId: req.user.id });
    console.error('Deploy error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST promote тест → боевая
router.post('/promote', A, async (req, res) => {
  try {
    const output = await run(['promote']);
    await saveHistory({ env: 'prod', action: 'promote', desc: 'Выкатка теста в боевую', status: 'ok', output, userId: req.user.id });
    res.json({ ok: true, output });
  } catch(e) {
    await saveHistory({ env: 'prod', action: 'promote', desc: 'Выкатка теста в боевую', status: 'error', errorMsg: e.message, userId: req.user.id });
    res.status(500).json({ error: e.message });
  }
});

// POST откат
router.post('/rollback', A, async (req, res) => {
  const n = Math.max(1, Math.min(20, parseInt(req.body.n) || 1));
  try {
    const output = await run(['rollback', String(n)]);
    await saveHistory({ env: 'prod', action: 'rollback', desc: `Откат на ${n} шаг(ов) назад`, status: 'ok', output, userId: req.user.id });
    res.json({ ok: true, output });
  } catch(e) {
    await saveHistory({ env: 'prod', action: 'rollback', desc: `Откат на ${n}`, status: 'error', errorMsg: e.message, userId: req.user.id });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
