const router = require('express').Router();
const crypto = require('crypto');
const https = require('https');
const User = require('../models/User');
const Points = require('../models/Points');
const auth = require('../middleware/auth');
const { sendToUser } = require('../ws');

// MAX Bot API: https://platform-api.max.ru
function maxApi(method, path, data) {
  return new Promise((resolve, reject) => {
    const token = process.env.MAX_BOT_TOKEN;
    if (!token) return resolve({});
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      hostname: 'platform-api.max.ru',
      path,
      method,
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(opts, res => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function sendMessage(chatId, text) {
  return maxApi('POST', '/messages', { chat_id: chatId, text });
}

// Генерация токена для привязки
router.post('/link-token', auth, async (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    await User.update({ linkToken: token, linkTokenAt: new Date() }, { where: { id: req.user.id } });
    const botUsername = process.env.MAX_BOT_USERNAME || 'vforme_bot';
    // MAX deep link: payload передаётся через ?payload= параметр
    res.json({ url: `https://max.ru/${botUsername}?payload=${token}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Webhook от MAX
router.post('/webhook', async (req, res) => {
  try {
    console.log('MAX webhook:', JSON.stringify(req.body));
    const update = req.body;

    // Извлекаем токен: bot_started → payload, message_created → /start TOKEN в тексте
    let token = null;
    let chatId = null;
    let maxUserId = null;
    let username = '';
    let firstName = '';

    if (update.update_type === 'bot_started') {
      token = update.payload || null;
      chatId = update.chat_id;
      maxUserId = update.user_id || update.user?.user_id;
      username = update.user?.username || '';
      firstName = update.user?.first_name || update.user?.name || '';
    } else if (update.update_type === 'message_created' && update.message) {
      const msg = update.message;
      chatId = msg.recipient?.chat_id;
      maxUserId = msg.sender?.user_id;
      username = msg.sender?.username || '';
      firstName = msg.sender?.name || '';
      const text = msg.body?.text || '';
      if (text.startsWith('/start')) token = text.split(' ')[1] || null;
    }

    if (token && chatId) {
      const { Op } = require('sequelize');
      const user = await User.findOne({
        where: { linkToken: token, linkTokenAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      });
      if (user) {
        if (user.maxId && user.maxId === String(maxUserId)) {
          await sendMessage(chatId, 'Ваш аккаунт уже привязан!');
        } else {
          await user.update({ maxId: String(maxUserId || chatId), maxUsername: username, linkToken: null });
          let bonusGiven = false;
          if (!user.maxBonusGiven) {
            await Points.create({ userId: user.id, amount: 100, reason: 'max_link', refType: 'max' });
            await user.update({ maxBonusGiven: true });
            bonusGiven = true;
          }
          await sendMessage(chatId, `Аккаунт привязан!\n\nПривет, ${firstName}! Вам начислено +100 баллов.\n\nДобро пожаловать в V Форме!`);
          sendToUser(user.id, { type: 'max_linked', bonusGiven, points: bonusGiven ? 100 : 0 });
        }
      } else {
        await sendMessage(chatId, 'Ссылка устарела. Получите новую в приложении.');
      }
    } else if (chatId && !token) {
      await sendMessage(chatId, 'Перейдите в приложение V Форме и нажмите "Подключить MAX".');
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('MAX webhook error:', e.message);
    res.json({ ok: true });
  }
});

// Отключить MAX
router.post('/unlink', auth, async (req, res) => {
  try {
    await User.update({ maxId: null, maxUsername: null, linkToken: null }, { where: { id: req.user.id } });
    sendToUser(req.user.id, { type: 'max_unlinked' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Установить webhook
router.get('/set-webhook', async (req, res) => {
  try {
    const data = await maxApi('POST', '/subscriptions', { url: `${process.env.APP_URL}/api/max/webhook` });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
