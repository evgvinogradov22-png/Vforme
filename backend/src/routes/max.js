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
    // MAX не поддерживает payload в deep link — юзер отправит код боту вручную
    const code = token.slice(0, 8).toUpperCase();
    await User.update({ linkToken: code, linkTokenAt: new Date() }, { where: { id: req.user.id } });
    res.json({ url: `https://max.ru/${botUsername}`, code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Webhook от MAX
router.post('/webhook', async (req, res) => {
  try {
    console.log('MAX webhook:', JSON.stringify(req.body));
    const update = req.body;

    const chatId = update.chat_id || update.message?.recipient?.chat_id;
    const maxUserId = update.user_id || update.user?.user_id || update.message?.sender?.user_id;
    const username = update.user?.username || update.message?.sender?.username || '';
    const firstName = update.user?.first_name || update.user?.name || update.message?.sender?.name || '';

    // bot_started — приветствие с инструкцией
    if (update.update_type === 'bot_started') {
      // Проверяем — может уже привязан
      const existing = await User.findOne({ where: { maxId: String(maxUserId) } });
      if (existing) {
        await sendMessage(chatId, `Привет, ${firstName}! Ваш аккаунт уже привязан к V Форме.`);
      } else {
        await sendMessage(chatId, `Привет, ${firstName}!\n\nЧтобы привязать аккаунт V Форме:\n1. Откройте приложение → Аккаунт → Подключить MAX\n2. Скопируйте код\n3. Отправьте его сюда`);
      }
    }

    // message_created — проверяем код привязки
    if (update.update_type === 'message_created' && update.message) {
      const text = (update.message.body?.text || '').trim().toUpperCase();
      if (text.length >= 6 && text.length <= 32) {
        const { Op } = require('sequelize');
        const user = await User.findOne({
          where: { linkToken: text, linkTokenAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });
        if (user) {
          await user.update({ maxId: String(maxUserId || chatId), maxUsername: username, linkToken: null });
          let bonusGiven = false;
          if (!user.maxBonusGiven) {
            await Points.create({ userId: user.id, amount: 100, reason: 'max_link', refType: 'max' });
            await user.update({ maxBonusGiven: true });
            bonusGiven = true;
          }
          await sendMessage(chatId, `Аккаунт привязан!\n\nПривет, ${firstName}! Вам начислено +100 баллов.\n\nДобро пожаловать в V Форме!`);
          sendToUser(user.id, { type: 'max_linked', bonusGiven, points: bonusGiven ? 100 : 0 });
        } else {
          await sendMessage(chatId, 'Код не найден или устарел. Получите новый в приложении.');
        }
      }
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
