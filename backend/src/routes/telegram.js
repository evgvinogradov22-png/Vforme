const router = require('express').Router();
const crypto = require('crypto');
const https = require('https');
const User = require('../models/User');
const Points = require('../models/Points');
const auth = require('../middleware/auth');
const { sendToUser } = require('../ws');

function tgPost(method, data) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
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
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendMessage(chatId, text) {
  return tgPost('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

router.post('/link-token', auth, async (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    await User.update({ linkToken: token, linkTokenAt: new Date() }, { where: { id: req.user.id } });
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'vforme_bot';
    res.json({ url: `https://t.me/${botUsername}?start=${token}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/webhook', async (req, res) => {
  try {
    console.log('TG webhook received:', JSON.stringify(req.body));
    const { message } = req.body;
    if (!message) return res.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || '';
    const username = message.from?.username;
    const firstName = message.from?.first_name || '';

    if (text.startsWith('/start')) {
      const token = text.split(' ')[1];
      if (token) {
        const { Op } = require('sequelize');
        const user = await User.findOne({
          where: { linkToken: token, linkTokenAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });
        if (user) {
          if (user.telegramId && user.telegramId === String(chatId)) {
            await sendMessage(chatId, 'Ваш аккаунт уже привязан!');
          } else {
            // Проверяем — не использовался ли этот Telegram ранее
            const existingTg = await User.findOne({ where: { telegramId: String(chatId) } });
            if (existingTg && existingTg.id !== user.id) {
              await sendMessage(chatId, 'Этот Telegram уже привязан к другому аккаунту V Форме. Использовать один мессенджер для нескольких аккаунтов нельзя.');
              return res.json({ ok: true });
            }
            await user.update({ telegramId: String(chatId), telegramUsername: username, linkToken: null });
            // Начисляем баллы только если первый раз привязывает
            let bonusGiven = false;
            if (!user.telegramBonusGiven) {
              await Points.create({ userId: user.id, amount: 100, reason: 'telegram_link', refType: 'telegram' });
              await user.update({ telegramBonusGiven: true });
              bonusGiven = true;
            }
            const msgResult = await sendMessage(chatId, `🎉 <b>Аккаунт привязан!</b>\n\nПривет, ${firstName}! Вам начислено <b>+100 баллов</b>.\n\n🌿 Добро пожаловать в V Форме!`);
            console.log('TG sendMessage result:', JSON.stringify(msgResult));
            // Live-уведомление в приложении
            sendToUser(user.id, { type: 'telegram_linked', bonusGiven, points: bonusGiven ? 100 : 0 });
          }
        } else {
          await sendMessage(chatId, '❌ Ссылка устарела. Получите новую в приложении.');
        }
      } else {
        await sendMessage(chatId, '🌿 Перейдите в приложение и нажмите "Подключить Telegram".');
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('TG webhook error:', e.message);
    res.json({ ok: true });
  }
});

// Отключение не поддерживается — привязка постоянная

router.get('/set-webhook', async (req, res) => {
  try {
    const data = await tgPost('setWebhook', { url: `${process.env.APP_URL}/api/telegram/webhook` });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
