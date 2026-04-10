const router = require('express').Router();
const https = require('https');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const ProtocolAccess = require('../models/ProtocolAccess');
const BroadcastHistory = require('../models/BroadcastHistory');
const { Op } = require('sequelize');

const A = [auth, role('admin', 'superadmin')];

// --- Утилиты отправки ---

function getAgent() {
  const proxy = process.env.TG_PROXY;
  if (!proxy) return undefined;
  try { const { SocksProxyAgent } = require('socks-proxy-agent'); return new SocksProxyAgent(proxy); } catch { return undefined; }
}

function tgSend(chatId, text) {
  return new Promise(resolve => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return resolve({ ok: false });
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const agent = getAgent();
    const opts = { hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      ...(agent ? { agent } : {}) };
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } }); });
    req.on('error', () => resolve({ ok: false }));
    req.write(body); req.end();
  });
}

function maxSend(chatId, text) {
  return new Promise(resolve => {
    const token = process.env.MAX_BOT_TOKEN;
    if (!token) return resolve({ ok: false });
    const body = JSON.stringify({ text });
    const opts = { hostname: 'platform-api.max.ru', path: `/messages?chat_id=${chatId}`, method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(opts, res => { let d = ''; res.setEncoding('utf8'); res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } }); });
    req.on('error', () => resolve({ ok: false }));
    req.write(body); req.end();
  });
}

// --- Аудитория ---

router.get('/audience', A, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'telegramId', 'telegramUsername', 'maxId', 'maxUsername', 'createdAt'],
      order: [['createdAt', 'DESC']], limit: 500,
    });
    const totalTg = users.filter(u => u.telegramId).length;
    const totalMax = users.filter(u => u.maxId).length;
    res.json({ users, totalTg, totalMax, total: users.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Сегменты ---

router.get('/segments', A, async (req, res) => {
  try {
    const totalTg = await User.count({ where: { telegramId: { [Op.ne]: null } } });
    const totalMax = await User.count({ where: { maxId: { [Op.ne]: null } } });
    const totalClub = await Subscription.count({ where: { plan: 'club', status: 'active' } });
    const total = await User.count();
    res.json({ total, totalTg, totalMax, totalClub });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Отправка рассылки ---

router.post('/send', A, async (req, res) => {
  try {
    const { message, segment, programId, protocolId, channels } = req.body;
    if (!message) return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    const sendTg = channels?.includes('telegram') !== false;
    const sendMax = channels?.includes('max') !== false;

    // Собираем пользователей
    let allUsers = await User.findAll({ attributes: ['id', 'telegramId', 'maxId', 'name', 'programAccess'] });

    if (segment === 'bought_program' && programId) {
      allUsers = allUsers.filter(u => (u.programAccess || []).includes(programId));
    } else if (segment === 'not_bought_program' && programId) {
      allUsers = allUsers.filter(u => !(u.programAccess || []).includes(programId));
    } else if (segment === 'bought_protocol' && protocolId) {
      const access = await ProtocolAccess.findAll({ where: { protocolId } });
      const ids = new Set(access.map(a => a.userId));
      allUsers = allUsers.filter(u => ids.has(u.id));
    } else if (segment === 'club') {
      const subs = await Subscription.findAll({ where: { plan: 'club', status: 'active' } });
      const ids = new Set(subs.map(s => s.userId));
      allUsers = allUsers.filter(u => ids.has(u.id));
    }

    let sentTg = 0, sentMax = 0, errorsTg = 0, errorsMax = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i];
      // Telegram
      if (sendTg && u.telegramId) {
        const r = await tgSend(u.telegramId, message);
        if (r.ok) sentTg++; else errorsTg++;
      }
      // MAX
      if (sendMax && u.maxId) {
        const r = await maxSend(u.maxId, message.replace(/<[^>]+>/g, '')); // MAX не поддерживает HTML
        if (r.message) sentMax++; else errorsMax++;
      }
      // Rate limit
      if ((i + 1) % 25 === 0) await new Promise(r => setTimeout(r, 1000));
    }

    // Сохраняем в историю
    const record = await BroadcastHistory.create({
      adminId: req.user.id,
      message,
      channels: channels || ['telegram', 'max'],
      segment: segment || 'all',
      segmentFilter: { programId, protocolId },
      sentTg, sentMax, errorsTg, errorsMax,
    });

    res.json({ ok: true, sentTg, sentMax, errorsTg, errorsMax, total: allUsers.length, id: record.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- История ---

router.get('/history', A, async (req, res) => {
  try {
    const list = await BroadcastHistory.findAll({ order: [['createdAt', 'DESC']], limit: 50 });
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
