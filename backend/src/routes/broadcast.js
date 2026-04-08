const router = require('express').Router();
const https = require('https');

function tgPost(token, method, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on('error', () => resolve({}));
    req.write(body);
    req.end();
  });
}
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const Order = require('../models/Order');
const ProtocolAccess = require('../models/ProtocolAccess');
const { Op } = require('sequelize');

const A = [auth, role('admin', 'superadmin')];

async function sendTg(chatId, text) {
  try {
    await tgPost(process.env.TELEGRAM_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
  } catch (e) { console.error('TG send error:', e.message); }
}

// Получить сегменты
router.get('/segments', A, async (req, res) => {
  try {
    const total = await User.count({ where: { telegramId: { [Op.ne]: null } } });
    res.json({ total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Отправить рассылку
router.post('/send', A, async (req, res) => {
  try {
    const { message, segment, programId, protocolId } = req.body;
    if (!message) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

    let users = [];

    if (segment === 'all') {
      users = await User.findAll({ where: { telegramId: { [Op.ne]: null } }, attributes: ['id', 'telegramId', 'name'] });
    } else if (segment === 'bought_program' && programId) {
      const allUsers = await User.findAll({ where: { telegramId: { [Op.ne]: null } }, attributes: ['id', 'telegramId', 'name', 'programAccess'] });
      users = allUsers.filter(u => (u.programAccess || []).includes(programId));
    } else if (segment === 'not_bought_program' && programId) {
      const allUsers = await User.findAll({ where: { telegramId: { [Op.ne]: null } }, attributes: ['id', 'telegramId', 'name', 'programAccess'] });
      users = allUsers.filter(u => !(u.programAccess || []).includes(programId));
    } else if (segment === 'bought_protocol' && protocolId) {
      const access = await ProtocolAccess.findAll({ where: { protocolId } });
      const userIds = access.map(a => a.userId);
      users = await User.findAll({ where: { id: userIds, telegramId: { [Op.ne]: null } }, attributes: ['id', 'telegramId', 'name'] });
    } else if (segment === 'not_bought_protocol' && protocolId) {
      const access = await ProtocolAccess.findAll({ where: { protocolId } });
      const boughtIds = access.map(a => a.userId);
      users = await User.findAll({ where: { id: { [Op.notIn]: boughtIds }, telegramId: { [Op.ne]: null } }, attributes: ['id', 'telegramId', 'name'] });
    } else if (segment === 'no_telegram') {
      const count = await User.count({ where: { telegramId: null } });
      return res.json({ ok: true, sent: 0, total: count, message: 'У этих пользователей нет Telegram' });
    }

    // Отправляем с задержкой чтобы не превысить лимиты Telegram
    let sent = 0;
    console.log(`📤 Рассылка: ${users.length} пользователей, сегмент: ${segment}`);
    console.log(`📤 Токен бота: ${process.env.TELEGRAM_BOT_TOKEN ? 'есть' : 'НЕТ!'}`);
    for (const user of users) {
      console.log(`📤 Отправка chatId: ${user.telegramId}`);
      await sendTg(user.telegramId, message);
      sent++;
      if (sent % 30 === 0) await new Promise(r => setTimeout(r, 1000));
    }

    console.log('📤 Рассылка: ' + sent + ' отправлено');
    res.json({ ok: true, sent, total: users.length });
  } catch (e) {
    console.error('Broadcast error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
