const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { broadcast } = require('../ws');
const Program = require('../models/Program');
const Module = require('../models/Module');
const Lecture = require('../models/Lecture');
const Recipe = require('../models/Recipe');
const SupplementScheme = require('../models/SupplementScheme');
const Supplement = require('../models/Supplement');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const bcrypt = require('bcryptjs');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const A = [auth, role('admin','superadmin')];
const SA = [auth, role('superadmin')];
const upload = multer({ dest: '/tmp/' });

// Whitelist полей для каждой модели
const ALLOWED_FIELDS = {
  Program:  ['title', 'subtitle', 'desc', 'icon', 'color', 'price', 'available', 'order', 'image', 'features', 'tags', 'coverImage'],
  Module:   ['title', 'desc', 'order', 'programId', 'icon'],
  Lecture:  ['title', 'content', 'order', 'moduleId', 'type', 'videoUrl', 'duration'],
  Recipe:   ['title', 'desc', 'content', 'image', 'tags', 'calories', 'available', 'cat', 'time', 'kcal', 'protein', 'fat', 'carbs', 'ingredients', 'steps', 'fact', 'imageUrl', 'dietTags'],
  Supplement: ['schemeId', 'name', 'dose', 'time', 'note', 'buyUrl', 'brand', 'image', 'order', 'promo', 'desc', 'link', 'tags', 'available'],
  SupplementScheme: ['title', 'desc', 'content', 'available', 'order', 'tags', 'price', 'coverImage'],
};

function pick(obj, fields) {
  if (!fields) return obj;
  return fields.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

// Соответствие модель → канал live-обновлений, который слушает фронт
const CHANNEL = {
  Program: 'programs', Module: 'programs', Lecture: 'programs',
  Recipe: 'recipes',
  Supplement: 'supplements', SupplementScheme: 'supplements',
};

function emitUpdate(modelName) {
  const channel = CHANNEL[modelName] || modelName.toLowerCase();
  broadcast({ type: 'data_updated', entity: channel });
}

const crud = (Model, extra) => ({
  getAll: async (req, res) => { try { res.json(await Model.findAll(extra || {})); } catch(e) { res.status(500).json({error:e.message}); } },
  create: async (req, res) => {
    try {
      const fields = ALLOWED_FIELDS[Model.name];
      const data = pick(req.body, fields);
      const row = await Model.create(data);
      emitUpdate(Model.name);
      res.json(row);
    } catch(e) { res.status(500).json({error:e.message}); }
  },
  update: async (req, res) => {
    try {
      const fields = ALLOWED_FIELDS[Model.name];
      const data = pick(req.body, fields);
      await Model.update(data, { where: { id: req.params.id } });
      emitUpdate(Model.name);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({error:e.message}); }
  },
  remove: async (req, res) => { try { await Model.destroy({where:{id:req.params.id}}); emitUpdate(Model.name); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } },
});

// Programs
const p = crud(Program, { order: [['order','ASC']] });
router.get('/programs', A, async (req, res) => {
  try {
    const progs = await Program.findAll({ order: [['order','ASC']] });
    const result = await Promise.all(progs.map(async prog => {
      const modules = await Module.findAll({ where: { programId: prog.id }, order: [['order','ASC']] });
      const modulesWithLectures = await Promise.all(modules.map(async mod => ({
        ...mod.toJSON(),
        lectures: await Lecture.findAll({ where: { moduleId: mod.id }, order: [['order','ASC']] })
      })));
      return { ...prog.toJSON(), modules: modulesWithLectures };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({error:e.message}); }
});
router.post('/programs', A, p.create);
router.put('/programs/:id', A, p.update);
router.delete('/programs/:id', A, p.remove);

// Modules
const m = crud(Module);
router.post('/modules', A, m.create);
router.put('/modules/:id', A, m.update);
router.delete('/modules/:id', A, m.remove);

// Lectures
const l = crud(Lecture);
router.post('/lectures', A, l.create);
router.put('/lectures/:id', A, l.update);
router.delete('/lectures/:id', A, l.remove);

// Recipes
router.get('/recipes', A, async (req, res) => { res.json(await Recipe.findAll({order:[['createdAt','DESC']]})); });
router.post('/recipes', A, upload.single('image'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    let imageUrl = null;
    if (req.file) {
      const filename = `recipe_${Date.now()}.jpg`;
      const outDir = path.join(__dirname, '../../uploads');
      fs.mkdirSync(outDir, { recursive: true });
      await sharp(req.file.path).resize(800).jpeg({ quality: 85 }).toFile(path.join(outDir, filename));
      fs.unlinkSync(req.file.path);
      imageUrl = `/uploads/${filename}`;
    }
    const row = await Recipe.create({ ...data, imageUrl, authorName: 'Кристина' });
    emitUpdate('Recipe');
    res.json(row);
  } catch(e) { res.status(500).json({error:e.message}); }
});
router.put('/recipes/:id', A, async (req,res) => { try { await Recipe.update(req.body,{where:{id:req.params.id}}); emitUpdate('Recipe'); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

// AI: посчитать калории/КБЖУ/факт по ингредиентам и шагам
router.post('/recipes/ai-generate', A, async (req, res) => {
  try {
    const { title = '', ingredients = '', steps = '' } = req.body || {};
    const https = require('https');
    const body = JSON.stringify({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [
        { role: 'system', content: 'Ты — нутрициолог-аналитик. По названию блюда, ингредиентам и шагам ты оцениваешь КБЖУ на одну порцию и подбираешь интересный нутрициологический факт. Отвечаешь СТРОГО в JSON.' },
        { role: 'user', content: `Название: ${title}\n\nИнгредиенты:\n${ingredients}\n\nШаги:\n${steps}\n\nВерни JSON:\n{\n  "kcal": число (ккал на порцию),\n  "protein": число (г),\n  "fat": число (г),\n  "carbs": число (г),\n  "fact": "интересный нутрициологический факт об этом блюде или его ингредиентах, 2-3 предложения, на русском",\n  "dietTags": ["подходит под диету", ... — несколько коротких тэгов: например 'без глютена', 'кето', 'низкоуглеводное', 'веган', 'высокобелковое' — только те что реально подходят]\n}\n\nТолько JSON, без markdown.` },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });
    const opts = {
      hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://app.nutrikris.ru',
        'X-Title': 'V Forme Recipes AI',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const raw = await new Promise((resolve, reject) => {
      const r = https.request(opts, resp => {
        resp.setEncoding('utf8');
        let d = ''; resp.on('data', c => d += c); resp.on('end', () => resolve(d));
      });
      r.on('error', reject); r.write(body); r.end();
    });
    const data = JSON.parse(raw);
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'AI не ответил' });
    let parsed;
    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const i = cleaned.indexOf('{'); const j = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.slice(i, j + 1));
    } catch { return res.status(502).json({ error: 'AI вернул не JSON' }); }
    res.json({
      kcal:    Number(parsed.kcal) || 0,
      protein: Number(parsed.protein) || 0,
      fat:     Number(parsed.fat) || 0,
      carbs:   Number(parsed.carbs) || 0,
      fact:    parsed.fact || '',
      dietTags: Array.isArray(parsed.dietTags) ? parsed.dietTags : [],
    });
  } catch (e) {
    console.error('Recipe AI error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
router.delete('/recipes/:id', A, async (req,res) => { try { await Recipe.destroy({where:{id:req.params.id}}); emitUpdate('Recipe'); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

// Supplement Schemes
router.get('/schemes', A, async (req, res) => {
  const schemes = await SupplementScheme.findAll();
  res.json(await Promise.all(schemes.map(async s => ({ ...s.toJSON(), items: await Supplement.findAll({where:{schemeId:s.id},order:[['order','ASC']]}) }))));
});
const sc = crud(SupplementScheme);
router.post('/schemes', A, sc.create);
router.put('/schemes/:id', A, sc.update);
router.delete('/schemes/:id', A, sc.remove);

const sp = crud(Supplement);
router.get('/supplements', A, sp.getAll);
router.post('/supplements', A, sp.create);
router.put('/supplements/:id', A, sp.update);
router.delete('/supplements/:id', A, sp.remove);

// Users — только суперадмин
router.get('/users', SA, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    const profiles = await UserProfile.findAll();
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId] = p; });
    res.json(users.map(u => ({ ...u.toJSON(), profile: profileMap[u.id] || null })));
  } catch(e) { res.status(500).json({error:e.message}); }
});
router.post('/users', SA, async (req,res) => {
  try {
    const { email, password, name, role: r } = req.body;
    const user = await User.create({ email, password: await bcrypt.hash(password,10), name, role: r });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch(e) { res.status(500).json({error:e.message}); }
});
router.put('/users/:id/role', SA, async (req,res) => { try { await User.update({role:req.body.role},{where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
router.delete('/users/:id', SA, async (req,res) => { try { await User.destroy({where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

// Доступ к программам
router.post('/users/:id/access', SA, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не найден' });
    const { programId, granted } = req.body;
    const current = user.programAccess || [];
    const updated = granted ? [...new Set([...current, programId])] : current.filter(id => id !== programId);
    await user.update({ programAccess: updated });
    res.json({ ok: true, programAccess: updated });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// Atlas results — Кристина видит прохождения анкеты клиентами
const AtlasResult = require('../models/AtlasResult');
router.get('/atlas', A, async (req, res) => {
  try {
    const rows = await AtlasResult.findAll({
      order: [['createdAt', 'DESC']],
      limit: 200,
      attributes: ['id', 'userId', 'createdAt', 'levels', 'focusZoneIds', 'complaints', 'gender'],
    });
    const userIds = [...new Set(rows.map(r => r.userId))];
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'email'],
    });
    const uMap = Object.fromEntries(users.map(u => [u.id, u]));
    res.json(rows.map(r => ({
      id: r.id,
      userId: r.userId,
      user: uMap[r.userId] || null,
      createdAt: r.createdAt,
      levels: r.levels,
      focusZoneIds: r.focusZoneIds,
      complaints: r.complaints,
      gender: r.gender,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/atlas/:id', A, async (req, res) => {
  try {
    const row = await AtlasResult.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Не найдено' });
    const user = await User.findByPk(row.userId, { attributes: ['id', 'name', 'email'] });
    res.json({ ...row.toJSON(), user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

// Баллы пользователей
const Points = require('../models/Points');
router.get('/users/:id/points', A, async (req, res) => {
  try {
    const rows = await Points.findAll({ where: { userId: req.params.id }, order: [['createdAt','DESC']] });
    const total = rows.reduce((s, r) => s + r.amount, 0);
    res.json({ total, history: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Начислить баллы вручную
router.post('/users/:id/points', A, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const point = await Points.create({ userId: req.params.id, amount, reason, refType: 'manual' });
    res.json({ ok: true, point });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Промокоды
const Promo = require('../models/Promo');
router.get('/promos', A, async (req, res) => { res.json(await Promo.findAll({ order: [['createdAt','DESC']] })); });
router.post('/promos', A, async (req, res) => {
  try {
    const data = { ...req.body, code: req.body.code.toUpperCase() };
    const row = await Promo.create(data);
    broadcast({ type: 'data_updated', entity: 'promos' });
    res.json(row);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
router.put('/promos/:id', A, async (req, res) => { try { await Promo.update(req.body, { where: { id: req.params.id } }); broadcast({ type: 'data_updated', entity: 'promos' }); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); } });
router.delete('/promos/:id', A, async (req, res) => { try { await Promo.destroy({ where: { id: req.params.id } }); broadcast({ type: 'data_updated', entity: 'promos' }); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Протоколы
const Protocol = require('../models/Protocol');
const ProtocolAccess = require('../models/ProtocolAccess');

router.get('/protocols', A, async (req, res) => { res.json(await Protocol.findAll({ order: [['order','ASC']] })); });
router.post('/protocols', A, async (req, res) => { try { const row = await Protocol.create(req.body); broadcast({ type: 'data_updated', entity: 'protocols' }); res.json(row); } catch(e) { res.status(500).json({ error: e.message }); } });
router.put('/protocols/:id', A, async (req, res) => { try { await Protocol.update(req.body, { where: { id: req.params.id } }); broadcast({ type: 'data_updated', entity: 'protocols' }); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); } });
router.delete('/protocols/:id', A, async (req, res) => { try { await Protocol.destroy({ where: { id: req.params.id } }); broadcast({ type: 'data_updated', entity: 'protocols' }); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Открыть доступ к протоколу вручную
router.post('/protocols/:id/access/:userId', A, async (req, res) => {
  try {
    await ProtocolAccess.findOrCreate({ where: { userId: req.params.userId, protocolId: req.params.id } });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Настройки чата
const ChatSettings = require('../models/ChatSettings');
router.get('/chat-settings', A, async (req, res) => {
  try {
    let s = await ChatSettings.findOne();
    if (!s) s = await ChatSettings.create({});
    res.json(s);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
router.put('/chat-settings', A, async (req, res) => {
  try {
    let s = await ChatSettings.findOne();
    if (!s) s = await ChatSettings.create({});
    await s.update(req.body);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Деплой
const { execSync } = require('child_process');
const VERSIONS_FILE = '/var/www/vforme_versions.json';

router.get('/deploy/versions', A, (req, res) => {
  try {
    const fs = require('fs');
    if (!fs.existsSync(VERSIONS_FILE)) return res.json([]);
    res.json(JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8')));
  } catch(e) { res.json([]); }
});

router.post('/deploy/test', A, (req, res) => {
  try {
    const { changelog } = req.body;
    const log = execSync(`bash /var/www/deploy.sh test "${changelog}"`, { timeout: 300000 }).toString();
    const fs = require('fs');
    const versions = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
    res.json({ ok: true, log, version: versions[0] });
  } catch(e) { res.status(500).json({ ok: false, error: e.message, log: e.stdout?.toString() || '' }); }
});

router.post('/deploy/promote', A, (req, res) => {
  try {
    const log = execSync(`bash /var/www/deploy.sh promote`, { timeout: 300000 }).toString();
    res.json({ ok: true, log });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/deploy/rollback', A, (req, res) => {
  try {
    const { num } = req.body;
    const log = execSync(`bash /var/www/deploy.sh rollback ${num || 1}`, { timeout: 60000 }).toString();
    res.json({ ok: true, log });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Список всех заказов
router.get('/orders', A, async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']], limit: 200 });
    const userIds = [...new Set(orders.map(o => o.userId))];
    const itemIds = [...new Set(orders.map(o => o.programId))];
    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'email'] });
    const programs = await Program.findAll({ where: { id: itemIds }, attributes: ['id', 'title'] });
    const Protocol = require('../models/Protocol');
    const protocols = await Protocol.findAll({ where: { id: itemIds }, attributes: ['id', 'title'] });
    const result = orders.map(o => ({
      ...o.toJSON(),
      user: users.find(u => u.id === o.userId),
      program: programs.find(p => p.id === o.programId) || protocols.find(p => p.id === o.programId),
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Удалить заказ
router.delete('/orders/:id', SA, async (req, res) => {
  try {
    await Order.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
