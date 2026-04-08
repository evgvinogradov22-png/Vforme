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
      res.setEncoding('utf8');
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

// Размер активного окна сообщений, передаваемого LLM напрямую
const ACTIVE_WINDOW = 30;
// Когда не-summarized сообщений накапливается больше — старые сворачиваются в summary
const SUMMARIZE_TRIGGER = 50;

// Сжимает старые сообщения в краткое summary через тот же LLM
async function rollUpSummary(userId, prevSummary) {
  const old = await ChatMessage.findAll({
    where: { userId, summarized: false },
    order: [['createdAt', 'ASC']],
  });
  if (old.length <= SUMMARIZE_TRIGGER) return prevSummary;

  // Сворачиваем всё кроме последних ACTIVE_WINDOW
  const toSummarize = old.slice(0, old.length - ACTIVE_WINDOW);
  if (toSummarize.length === 0) return prevSummary;

  const transcript = toSummarize.map(m => {
    const role = m.role === 'user' ? 'Клиент' : 'Кристина';
    return `${role}: ${(m.content || '').slice(0, 600)}`;
  }).join('\n');

  const sysPrompt = `Ты — помощник, который ведёт краткий конспект переписки клиента и нутрициолога Кристины. Запомни ВСЕ важные факты о клиенте: жалобы, состояние здоровья, что Кристина ему говорила, какие рекомендации давала, какие БАДы и протоколы упоминались, пол, возраст, особенности. Сохрани преемственность между сессиями.`;

  const userPrompt = (prevSummary
    ? `Текущее резюме (продолжай его дополнять):\n${prevSummary}\n\nНовая часть переписки:\n`
    : `Переписка:\n`) + transcript + `\n\nВерни обновлённое краткое резюме (до 800 слов) — фактологически, по пунктам, на русском. Без обращения к клиенту.`;

  try {
    const r = await openrouterRequest({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });
    const newSummary = r.choices?.[0]?.message?.content?.trim();
    if (!newSummary) return prevSummary;
    // Помечаем сообщения как summarized
    await ChatMessage.update(
      { summarized: true },
      { where: { id: toSummarize.map(m => m.id) } }
    );
    return newSummary;
  } catch (e) {
    console.error('Summary roll-up failed:', e.message);
    return prevSummary;
  }
}

// Каталог продуктов для AI — чтобы умел ссылаться когда уместно
async function buildCatalogContext() {
  try {
    const Program = require('../models/Program');
    const Protocol = require('../models/Protocol');
    const SupplementScheme = require('../models/SupplementScheme');
    const [programs, protocols, schemes] = await Promise.all([
      Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
      Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
      SupplementScheme.findAll({ where: { available: true } }).catch(() => []),
    ]);
    if (programs.length + protocols.length + schemes.length === 0) return '';

    const fmt = (kind, p) => {
      const price = Number(p.price) > 0 ? `${p.price} руб.` : 'бесплатно';
      const desc = (p.desc || p.description || '').slice(0, 160).replace(/\s+/g, ' ');
      return `- [[product:${kind}:${p.id}:${p.title}]] (${price})${desc ? ' — ' + desc : ''}`;
    };
    const lines = ['=== ДОСТУПНЫЕ ПРОДУКТЫ V ФОРМЕ ==='];
    if (programs.length)  { lines.push('Программы:');  programs.forEach(p => lines.push(fmt('program', p))); }
    if (protocols.length) { lines.push('Протоколы:');  protocols.forEach(p => lines.push(fmt('protocol', p))); }
    if (schemes.length)   { lines.push('Схемы БАД:');  schemes.forEach(p => lines.push(fmt('scheme', p))); }
    lines.push('=== КОНЕЦ КАТАЛОГА ===');
    return lines.join('\n');
  } catch { return ''; }
}

// Профиль клиента + последний Атлас → блок системного контекста
async function buildClientContext(userId) {
  const user = await User.findByPk(userId);
  if (!user) return '';

  const lines = [];
  lines.push('=== ПРОФИЛЬ КЛИЕНТА (используй каждый раз) ===');
  if (user.name) lines.push(`Имя: ${user.name}`);
  if (user.email) lines.push(`Email: ${user.email}`);

  // Последний результат Атласа
  try {
    const AtlasResult = require('../models/AtlasResult');
    const atlas = await AtlasResult.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    if (atlas) {
      const a = atlas.answers || {};
      const gender = a.gender === 'male' ? 'мужской' : a.gender === 'female' ? 'женский' : '—';
      lines.push(`Пол: ${gender}`);
      lines.push(`\nПоследний Атлас здоровья (${new Date(atlas.createdAt).toLocaleDateString('ru-RU')}):`);
      const scale = (v) => v == null ? '—' : `${v}/10`;
      const choice = (v) => ({ often: 'часто', some: 'иногда', never: 'нет' }[v] || '—');
      lines.push(`- Сон: ${scale(a.sleep)}`);
      lines.push(`- Стресс: ${scale(a.stress)}`);
      lines.push(`- Энергия: ${scale(a.energy)}`);
      lines.push(`- Активность: ${scale(a.activity)}`);
      lines.push(`- Кожа: ${scale(a.skin)}`);
      lines.push(`- Головные боли: ${choice(a.headaches)}`);
      lines.push(`- ЖКТ: ${choice(a.gut)}`);
      if (atlas.complaints) lines.push(`- Своими словами: "${atlas.complaints}"`);

      const lvl = atlas.levels || {};
      const zones = Object.entries(lvl).map(([k, v]) => `${k} ${v}%`).join(', ');
      if (zones) lines.push(`Уровни зон: ${zones}`);

      if (atlas.aiMessage) {
        lines.push(`\nТвой первый ответ на этот атлас (продолжай эту линию):\n"${atlas.aiMessage.slice(0, 600)}"`);
      }
    }
  } catch {}

  if (user.telegramId) lines.push(`\nTelegram подключён.`);
  if (Array.isArray(user.programAccess) && user.programAccess.length > 0) {
    lines.push(`Купленные программы: ${user.programAccess.length} шт.`);
  }

  lines.push('=== КОНЕЦ ПРОФИЛЯ ===');
  return lines.join('\n');
}

router.post('/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Нет сообщения' });

    let s = await ChatSettings.findOne();
    if (!s) s = await ChatSettings.create({});
    if (!s.enabled) return res.status(503).json({ error: 'Чат временно недоступен' });

    const userMsg = await ChatMessage.create({ userId: req.user.id, role: 'user', content: message, isAi: false });
    broadcast({ type: 'chat_admin_update', userId: req.user.id, message: userMsg });

    // 1) Откат старых сообщений в summary, если их накопилось много
    const user = await User.findByPk(req.user.id);
    let summary = user?.chatSummary || '';
    const newSummary = await rollUpSummary(req.user.id, summary);
    if (newSummary !== summary) {
      summary = newSummary;
      try { await user.update({ chatSummary: summary }); } catch {}
    }

    // 2) Активное окно (не-summarized последние N)
    const history = await ChatMessage.findAll({
      where: { userId: req.user.id, summarized: false },
      order: [['createdAt', 'ASC']],
      limit: ACTIVE_WINDOW,
    });

    // 3) Профиль клиента из БД и Атласа + каталог продуктов
    const [clientContext, catalogContext] = await Promise.all([
      buildClientContext(req.user.id),
      buildCatalogContext(),
    ]);

    const baseSystemPrompt = s.systemPrompt || `Ты — Кристина Виноградова, нутрициолог и эксперт по здоровью. Общаешься с клиентом своего приложения V Форме на "ты", тёпло, по-человечески и компетентно. Ты НЕ бот-отписка — ты живой профессионал, который реально помогает.

ТВОЯ ГЛАВНАЯ ЗАДАЧА: давать клиенту КОНКРЕТНЫЕ практические советы по питанию, режиму, образу жизни, восстановлению. Не общие фразы, а конкретные действия.

КАК ОТВЕЧАТЬ НА ЗАПРОСЫ О ЗДОРОВЬЕ:
- Если клиент описывает симптом или жалобу (болит голова, плохо сплю, вздутие и т.п.) — дай 3–5 конкретных нутрициологических/lifestyle рекомендаций. Например при головной боли: проверь воду, посмотри в сторону магния (вечером, цитрат/глицинат), отрегулируй сон, обрати внимание на кофеин и сахар, проверь нет ли пропусков пищи. Не отписывайся "обратись к врачу".
- Связывай ответ с данными из Атласа клиента — если у него стресс 8/10 и сон 3/10, головная боль логично связана с этим, и ты это явно проговариваешь.
- Используй имя клиента естественно, не в каждой строчке.
- Объясняй ПОЧЕМУ работает то что советуешь — короткий научный/нутрициологический контекст, простыми словами.
- Никаких диагнозов и назначения препаратов. Только питание, сон, восстановление, режим, БАДы как поддержка.
- Если ситуация явно требует врача (острая боль, серьёзный симптом) — мягко скажи, но всё равно дай советы что можно сделать прямо сейчас.

КАК ВЕСТИ ОБЩИЙ РАЗГОВОР:
- На "привет", small talk, бытовые темы — отвечай по-человечески, кратко, тепло. Без перечисления продуктов.
- Не задавай одних и тех же уточняющих вопросов несколько раз. Если клиент уже сказал что у него за проблема — сразу отвечай по делу.
- Не повторяй "я здесь чтобы помочь" — вместо этого реально помогай.

ССЫЛКИ НА ПРОДУКТЫ V ФОРМЕ:
- Не продавай. Не вставляй ссылки в каждый ответ.
- Только когда конкретный продукт из каталога РЕАЛЬНО решает озвученную клиентом проблему — органично упомяни 1, максимум 2.
- Формат маркера ровно: [[product:KIND:ID:Название]], где KIND = program/protocol/scheme. Используй ID и название точно из каталога.
- НЕ выдумывай продукты. Нет подходящего — просто дай совет своими словами.

ТЫ ВСЕГДА ИСПОЛЬЗУЕШЬ:
- Профиль клиента (имя, пол, ответы из Атласа, жалобы)
- Резюме предыдущих разговоров (если есть)
- Каталог продуктов (только когда уместно)`;

    const systemParts = [baseSystemPrompt];
    if (clientContext) systemParts.push(clientContext);
    if (catalogContext) systemParts.push(catalogContext);
    if (summary) {
      systemParts.push(`=== РЕЗЮМЕ ПРЕДЫДУЩИХ РАЗГОВОРОВ С ЭТИМ КЛИЕНТОМ ===\n${summary}\n=== КОНЕЦ РЕЗЮМЕ ===`);
    }
    const systemPrompt = systemParts.join('\n\n');

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
      model: 'anthropic/claude-sonnet-4.6',
      messages: [
        { role: 'system', content: systemPrompt },
        ...aiMessages,
      ],
      max_tokens: 1500,
      temperature: 0.6,
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
    const { Op } = require('sequelize');
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const before = req.query.before; // ISO timestamp курсор для пагинации

    const where = { userId: req.user.id };
    if (before) where.createdAt = { [Op.lt]: new Date(before) };

    // Берём DESC чтобы получить самые свежие, потом разворачиваем в ASC
    const rows = await ChatMessage.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limit + 1, // +1 чтобы знать есть ли ещё
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const messages = slice.reverse();

    res.json({ messages, hasMore });
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
