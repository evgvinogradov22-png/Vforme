const router = require('express').Router();
const https = require('https');
const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const UserSupplement = require('../models/UserSupplement');
const ShoppingItem = require('../models/ShoppingItem');
const AtlasResult = require('../models/AtlasResult');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

function openrouter(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://app.nutrikris.ru',
        'X-Title': 'V Forme Tracker',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, res => {
      res.setEncoding('utf8');
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const i = cleaned.indexOf('{'); const j = cleaned.lastIndexOf('}');
  const k = cleaned.indexOf('['); const l = cleaned.lastIndexOf(']');
  const start = (k !== -1 && (i === -1 || k < i)) ? k : i;
  const end   = (l !== -1 && (j === -1 || l > j)) ? l : j;
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

// ─── ПРИВЫЧКИ ────────────────────────────────────────────────
router.get('/habits', auth, async (req, res) => {
  try {
    const [habits, logs] = await Promise.all([
      Habit.findAll({ where: { userId: req.user.id }, order: [['order', 'ASC'], ['createdAt', 'ASC']] }),
      HabitLog.findAll({ where: { userId: req.user.id } }),
    ]);
    res.json({ habits, logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/habits', auth, async (req, res) => {
  try {
    const { name, icon, color, order } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Нет названия' });
    const h = await Habit.create({
      userId: req.user.id, name,
      icon: icon || '✦', color: color || '#3D6B3D', order: order || 0,
    });
    res.json(h);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/habits/:id', auth, async (req, res) => {
  try {
    await Habit.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/habits/log', auth, async (req, res) => {
  try {
    const { date, log } = req.body || {};
    if (!date) return res.status(400).json({ error: 'Нет даты' });
    const [row] = await HabitLog.upsert({ userId: req.user.id, date, log: log || {} });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI-генерация 5 привычек на основе Атласа
router.post('/habits/ai-generate', auth, async (req, res) => {
  try {
    const atlas = await AtlasResult.findOne({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    const profile = atlas ? JSON.stringify({
      answers: atlas.answers, complaints: atlas.complaints, levels: atlas.levels,
    }, null, 2) : '(атлас не пройден, предложи базовые привычки)';

    const r = await openrouter({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [
        { role: 'system', content: 'Ты — нутрициолог. Подбираешь ежедневные привычки под конкретного клиента. Отвечай СТРОГО в JSON массиве.' },
        { role: 'user', content: `Профиль клиента из Атласа здоровья:\n${profile}\n\nПредложи РОВНО 5 простых ежедневных привычек которые реально помогут улучшить его слабые зоны. Каждая привычка — короткая формулировка 3-7 слов, подходящий эмодзи.\n\nВерни массив без markdown:\n[\n  { "name": "Выпить стакан воды с лимоном утром", "icon": "💧" },\n  ...\n]` },
      ],
      max_tokens: 500,
      temperature: 0.6,
    });
    const raw = r.choices?.[0]?.message?.content;
    const arr = extractJson(raw);
    if (!Array.isArray(arr)) return res.status(502).json({ error: 'AI не вернул массив' });

    const existing = await Habit.count({ where: { userId: req.user.id } });
    const created = [];
    for (let i = 0; i < arr.length && i < 5; i++) {
      const h = arr[i];
      if (!h?.name) continue;
      created.push(await Habit.create({
        userId: req.user.id,
        name: String(h.name).slice(0, 120),
        icon: String(h.icon || '✦').slice(0, 6),
        order: existing + i,
      }));
    }
    res.json(created);
  } catch (e) {
    console.error('AI habits error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── ДОБАВКИ ─────────────────────────────────────────────────
router.get('/supplements', auth, async (req, res) => {
  try {
    res.json(await UserSupplement.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/supplements', auth, async (req, res) => {
  try {
    const { name, dose, time, course, recommendation } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Нет названия' });
    const row = await UserSupplement.create({
      userId: req.user.id, name, dose, time, course, recommendation,
    });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/supplements/:id', auth, async (req, res) => {
  try {
    const row = await UserSupplement.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: 'Не найдено' });
    await row.update(req.body || {});
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/supplements/:id', auth, async (req, res) => {
  try {
    await UserSupplement.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/supplements/ai-recommend', auth, async (req, res) => {
  try {
    const { name, dose } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Нет названия' });
    const r = await openrouter({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [
        { role: 'system', content: 'Ты — нутрициолог. Кратко и по делу рекомендуешь как правильно принимать БАД: время, с едой/без, важные нюансы сочетаемости. Без лишней воды.' },
        { role: 'user', content: `БАД: ${name}${dose ? ` (${dose})` : ''}\n\nДай рекомендацию по приёму (2-3 предложения, на "ты"). Укажи лучшее время суток и ключевые нюансы совместимости.` },
      ],
      max_tokens: 260,
      temperature: 0.4,
    });
    const text = r.choices?.[0]?.message?.content?.trim() || '';
    res.json({ recommendation: text });
  } catch (e) {
    console.error('AI supplement rec error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── СПИСОК ПОКУПОК ──────────────────────────────────────────
router.get('/shopping', auth, async (req, res) => {
  try {
    res.json(await ShoppingItem.findAll({ where: { userId: req.user.id }, order: [['done', 'ASC'], ['createdAt', 'DESC']] }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/shopping', auth, async (req, res) => {
  try {
    const { items, name, category, source, sourceId } = req.body || {};
    if (Array.isArray(items) && items.length > 0) {
      const created = await Promise.all(items.map(it => ShoppingItem.create({
        userId: req.user.id,
        name: String(it.name || '').slice(0, 200),
        category: it.category || 'ingredient',
        source: it.source || null,
        sourceId: it.sourceId || null,
      }).catch(() => null)));
      return res.json(created.filter(Boolean));
    }
    if (!name) return res.status(400).json({ error: 'Нет name / items' });
    const row = await ShoppingItem.create({
      userId: req.user.id,
      name: String(name).slice(0, 200),
      category: category || 'ingredient',
      source: source || null,
      sourceId: sourceId || null,
    });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/shopping/:id', auth, async (req, res) => {
  try {
    await ShoppingItem.update(
      { done: !!req.body.done },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/shopping/:id', auth, async (req, res) => {
  try {
    await ShoppingItem.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/shopping', auth, async (req, res) => {
  try {
    await ShoppingItem.destroy({ where: { userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Таски (старая вкладка трекера) ──────────────────────────
router.get('/tasks', auth, async (req, res) => {
  try { res.json(await Task.findAll({ where: { userId: req.user.id }, order: [['createdAt','ASC']] })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/tasks', auth, async (req, res) => {
  try { res.json(await Task.create({ ...req.body, userId: req.user.id })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.patch('/tasks/:id', auth, async (req, res) => {
  try { await Task.update(req.body, { where: { id: req.params.id, userId: req.user.id } }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
