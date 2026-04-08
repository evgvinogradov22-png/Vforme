const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 5000 }, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}
const User = require('../models/User');
const Order = require('../models/Order');
const Points = require('../models/Points');
const sequelize = require('../db');
const { Op } = require('sequelize');

const SA = [auth, role('admin', 'superadmin')];

// Системная статистика — через Node.js os module (без shell команд)
router.get('/system', SA, async (req, res) => {
  try {
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg().map(v => v.toFixed(2));
    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `up ${hours}h ${minutes}m`;

    // CPU — async через /proc/stat если доступно
    const cpuRaw = await runCmd("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").catch(() => '0');
    const diskRaw = await runCmd("df -h / | awk 'NR==2{print $2,$3,$4,$5}'").catch(() => '');
    const diskParts = diskRaw.split(' ');

    res.json({
      cpu: parseFloat(cpuRaw) || 0,
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: Math.round((usedMem / totalMem) * 100),
      },
      disk: {
        total: diskParts[0] || 'N/A',
        used: diskParts[1] || 'N/A',
        free: diskParts[2] || 'N/A',
        percent: diskParts[3] || 'N/A',
      },
      uptime,
      loadAvg,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Nginx логи — последние запросы
router.get('/nginx', SA, async (req, res) => {
  try {
    const logPath = '/var/log/nginx/access.log';
    if (!fs.existsSync(logPath)) return res.json({ lines: [] });
    const buf = fs.readFileSync(logPath);
    const lines_all = buf.toString().trim().split('\n');
    const raw = lines_all.slice(-100).join('\n');
    const lines = raw.trim().split('\n').reverse().slice(0, 50).map(line => {
      const match = line.match(/^(\S+) - - \[(.+?)\] "(\S+) (\S+) \S+" (\d+) (\d+)/);
      if (!match) return { raw: line };
      return {
        ip: match[1],
        time: match[2],
        method: match[3],
        path: match[4],
        status: parseInt(match[5]),
        size: parseInt(match[6]),
      };
    });
    res.json({ lines });
  } catch (e) {
    res.json({ lines: [], error: e.message });
  }
});

// PM2 логи
router.get('/pm2logs', SA, async (req, res) => {
  try {
    const outLog = '/root/.pm2/logs/vforme-api-out.log';
    const errLog = '/root/.pm2/logs/vforme-api-error.log';
    const readTail = (file, n) => {
      if (!fs.existsSync(file)) return [];
      const lines = fs.readFileSync(file).toString().trim().split('\n').filter(Boolean);
      return lines.slice(-n).reverse();
    };
    const out = readTail(outLog, 50);
    const err = readTail(errLog, 30);
    res.json({ out, err });
  } catch (e) {
    res.json({ out: [], err: [], error: e.message });
  }
});

// Статистика пользователей
router.get('/users', SA, async (req, res) => {
  try {
    const total = await User.count();
    const today = new Date(); today.setHours(0,0,0,0);
    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const todayCount = await User.count({ where: { createdAt: { [Op.gte]: today } } });
    const weekCount = await User.count({ where: { createdAt: { [Op.gte]: week } } });
    const monthCount = await User.count({ where: { createdAt: { [Op.gte]: month } } });

    // Регистрации по дням за 30 дней
    const regByDay = await sequelize.query(`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Users"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Последние регистрации
    const recent = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.json({ total, todayCount, weekCount, monthCount, regByDay, recent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Статистика платежей
router.get('/payments', SA, async (req, res) => {
  try {
    const total = await Order.count({ where: { status: 'paid' } });
    const totalRevenue = await Order.sum('amount', { where: { status: 'paid' } });
    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekRevenue = await Order.sum('amount', { where: { status: 'paid', updatedAt: { [Op.gte]: week } } });

    const recent = await Order.findAll({
      where: { status: 'paid' },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    });

    res.json({ total, totalRevenue: totalRevenue || 0, weekRevenue: weekRevenue || 0, recent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Статистика баллов
router.get('/points', SA, async (req, res) => {
  try {
    const totalAwarded = await Points.sum('amount') || 0;
    const byReason = await sequelize.query(`
      SELECT reason, SUM(amount) as total, COUNT(*) as count
      FROM "Points"
      GROUP BY reason
      ORDER BY total DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ totalAwarded, byReason });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

// Лог отправленных писем
router.get('/emails', SA, async (req, res) => {
  try {
    const EmailLog = require('../models/EmailLog');
    const logs = await EmailLog.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    const total = await EmailLog.count();
    const errors = await EmailLog.count({ where: { status: 'error' } });
    res.json({ total, errors, logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
