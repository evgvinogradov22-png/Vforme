const router = require('express').Router();
const https = require('https');
const User = require('../models/User');
const Points = require('../models/Points');
const auth = require('../middleware/auth');
const { sendToUser } = require('../ws');

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

// Webhook от MAX
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    const chatId = update.chat_id || update.message?.recipient?.chat_id;
    const maxUserId = update.user_id || update.user?.user_id || update.message?.sender?.user_id;
    const username = update.user?.username || update.message?.sender?.username || '';
    const firstName = update.user?.first_name || update.user?.name || update.message?.sender?.name || '';

    // bot_started — приветствие
    if (update.update_type === 'bot_started') {
      const existing = maxUserId ? await User.findOne({ where: { maxId: String(maxUserId) } }) : null;
      if (existing) {
        await sendMessage(chatId, `Привет, ${firstName}! Ваш аккаунт V Форме уже привязан.`);
      } else {
        await sendMessage(chatId, `Привет, ${firstName}!\n\nОтправьте email, который вы использовали при регистрации в V Форме, и я привяжу ваш аккаунт.`);
      }
    }

    // message — проверяем email
    if (update.update_type === 'message_created' && update.message) {
      const text = (update.message.body?.text || '').trim().toLowerCase();

      // Проверяем — уже привязан?
      const already = maxUserId ? await User.findOne({ where: { maxId: String(maxUserId) } }) : null;
      if (already) {
        await sendMessage(chatId, 'Ваш аккаунт уже привязан!');
        return res.json({ ok: true });
      }

      // Похоже на email?
      if (text.includes('@') && text.includes('.')) {
        const user = await User.findOne({ where: { email: text } });
        if (user) {
          await user.update({ maxId: String(maxUserId || chatId), maxUsername: username });
          let bonusGiven = false;
          if (!user.maxBonusGiven) {
            await Points.create({ userId: user.id, amount: 100, reason: 'max_link', refType: 'max' });
            await user.update({ maxBonusGiven: true });
            bonusGiven = true;
          }
          await sendMessage(chatId, `Аккаунт привязан!\n\nПривет, ${firstName}! Вам начислено +100 баллов.\n\nДобро пожаловать в V Форме!`);
          sendToUser(user.id, { type: 'max_linked', bonusGiven, points: bonusGiven ? 100 : 0 });
        } else {
          await sendMessage(chatId, 'Аккаунт с таким email не найден. Проверьте правильность или зарегистрируйтесь в приложении V Форме.');
        }
      } else {
        await sendMessage(chatId, 'Отправьте ваш email для привязки аккаунта V Форме.');
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
    await User.update({ maxId: null, maxUsername: null }, { where: { id: req.user.id } });
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
