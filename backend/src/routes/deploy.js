const router = require('express').Router();
const { execFile } = require('child_process');
const fs = require('fs');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const A = [auth, role('admin', 'superadmin')];
const VERSIONS_FILE = '/var/www/vforme_backups/versions.json';
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

// GET статус серверов
router.get('/status', A, async (req, res) => {
  try {
    const [prod, test] = await Promise.all([checkHealth(3001), checkHealth(3002)]);
    res.json({ prod, test });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET список версий
router.get('/versions', A, async (req, res) => {
  try {
    if (!fs.existsSync(VERSIONS_FILE)) return res.json([]);
    const data = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
    res.json(data);
  } catch(e) { res.json([]); }
});

// POST деплой на тест
router.post('/deploy', A, async (req, res) => {
  try {
    const { desc } = req.body;
    if (!desc) return res.status(400).json({ error: 'Введи описание' });
    // Валидация: только безопасные символы, макс 200 символов
    const safeDesc = String(desc).slice(0, 200).replace(/[^a-zA-Zа-яёА-ЯЁ0-9 .,!?()_-]/g, '');
    const output = await run(['deploy', safeDesc]);
    res.json({ ok: true, output });
  } catch(e) {
    console.error('Deploy error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST promote тест → боевая
router.post('/promote', A, async (req, res) => {
  try {
    const output = await run(['promote']);
    res.json({ ok: true, output });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST откат
router.post('/rollback', A, async (req, res) => {
  try {
    const n = Math.max(1, Math.min(20, parseInt(req.body.n) || 1));
    const output = await run(['rollback', String(n)]);
    res.json({ ok: true, output });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
