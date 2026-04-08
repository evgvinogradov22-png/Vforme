const router = require('express').Router();
const https = require('https');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ChatSettings = require('../models/ChatSettings');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { sendToUser, broadcast } = require('../ws');

const A = [auth, role('admin', 'superadmin')];

function openrouterRequest(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://app.nutrikris.ru',
        'X-Title': 'V Forme',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Upload file in chat
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

const s3 = new S3Client({
  endpoint: process.env.YC_ENDPOINT || 'https://storage.yandexcloud.net',
  region: 'ru-central1',
  credentials: { accessKeyId: process.env.YC_ACCESS_KEY, secretAccessKey: process.env.YC_SECRET_KEY },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const key = `chat/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.YC_BUCKET || 'vforme-uploads',
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
    const url = `${process.env.YC_ENDPOINT || 'https://storage.yandexcloud.net'}/${process.env.YC_BUCKET || 'vforme-uploads'}/${key}`;
    const isImage = /image/.test(req.file.mimetype);
    // Сохраняем как сообщение
    await ChatMessage.create({ userId: req.user.id, role: 'user', content: isImage ? `[img]${url}` : `[file]${req.file.originalname}|${url}`, isAi: false });
    res.json({ url, name: req.file.originalname, isImage });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/settings', async (req, res) => {
  try {
    let s = await ChatSettings.findOne();
    if (!s) s = await ChatSettings.create({});
    res.json({ assistantName: s.assistantName, welcomeMessage: s.welcomeMessage, enabled: s.enabled });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Нет сообщения' });

    let s = await ChatSettings.findOne();
    if (!s) s = await ChatSettings.create({});
    if (!s.enabled) return res.status(503).json({ error: 'Чат временно недоступен' });

    const userMsg = await ChatMessage.create({ userId: req.user.id, role: 'user', content: message, isAi: false });
    // Live: оповестить админов о новом сообщении клиента
    broadcast({ type: 'chat_admin_update', userId: req.user.id, message: userMsg });

    const history = await ChatMessage.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
      limit: 20,
    });

    const systemPrompt = s.systemPrompt ||
      `Ты — Кристина Виноградова, нутрициолог и эксперт по здоровью. Ты общаешься с клиентами своего онлайн-приложения V Форме. Отвечай тепло, по-дружески, но профессионально. Отвечай на русском языке.`;

    const aiMessages = history.map(m => {
      const role = m.role === 'admin' ? 'assistant' : m.role;
      const c = m.content || '';
      if (c.startsWith('[img]')) {
        const url = c.slice(5);
        return { role, content: [{ type: 'image_url', image_url: { url } }, { type: 'text', text: 'Пользователь прислал изображение. Проанализируй его и дай развёрнутый комментарий.' }] };
      }
      if (c.startsWith('[file]')) {
        const [name] = c.slice(6).split('|');
        return { role, content: `Пользователь прислал файл: ${name}` };
      }
      return { role, content: c };
    });

    const response = await openrouterRequest({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...aiMessages,
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Нет ответа: ' + JSON.stringify(response).slice(0,200) });

    await ChatMessage.create({ userId: req.user.id, role: 'assistant', content: reply, isAi: true });
    res.json({ reply });
  } catch(e) {
    console.error('Chat error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST image message — сохраняем и сразу отправляем в AI как vision
router.post('/image-message', auth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Нет URL' });

    let s = await ChatSettings.findOne();
    if (!s) s = await ChatSettings.create({});

    const systemPrompt = s.systemPrompt ||
      `Ты — Кристина Виноградова, нутрициолог. Проанализируй изображение и дай развёрнутый комментарий на русском языке.`;

    const response = await openrouterRequest({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: 'Пожалуйста, проанализируй это изображение.' }
        ]}
      ],
      max_tokens: 1500,
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Нет ответа: ' + JSON.stringify(response).slice(0,200) });

    await ChatMessage.create({ userId: req.user.id, role: 'assistant', content: reply, isAi: true });
    res.json({ reply });
  } catch(e) {
    console.error('Image message error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
      limit: 50,
    });
    res.json(messages);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/chats', A, async (req, res) => {
  try {
    const { fn, col } = require('sequelize');
    const last = await ChatMessage.findAll({
      attributes: ['userId', [fn('MAX', col('createdAt')), 'lastAt'], [fn('COUNT', col('id')), 'count']],
      group: ['userId'],
      order: [[fn('MAX', col('createdAt')), 'DESC']],
      limit: 50,
      raw: true,
    });
    const users = await User.findAll({ where: { id: last.map(m => m.userId) }, attributes: ['id', 'name', 'email', 'telegramUsername'] });
    res.json(last.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/chats/:userId', A, async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'ASC']],
      limit: 100,
    });
    res.json(messages);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/admin/chats/:userId/send', A, async (req, res) => {
  try {
    const { content } = req.body;
    const msg = await ChatMessage.create({ userId: req.params.userId, role: 'admin', content, isAi: false });
    // Live: доставить сообщение клиенту
    sendToUser(req.params.userId, { type: 'chat_message', message: msg });
    // Live: обновить список чатов у админов
    broadcast({ type: 'chat_admin_update', userId: req.params.userId });
    const user = await User.findByPk(req.params.userId);
    if (user?.telegramId) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const body = JSON.stringify({ chat_id: user.telegramId, text: `💬 Кристина:\n\n${content}` });
      const opts = { hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
      const r = https.request(opts, () => {}); r.on('error', () => {}); r.write(body); r.end();
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
