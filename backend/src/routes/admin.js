const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Program = require('../models/Program');
const Module = require('../models/Module');
const Lecture = require('../models/Lecture');
const Recipe = require('../models/Recipe');
const SupplementScheme = require('../models/SupplementScheme');
const Supplement = require('../models/Supplement');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const A = [auth, role('admin','superadmin')];
const SA = [auth, role('superadmin')];
const upload = multer({ dest: '/tmp/' });

const crud = (Model, extra) => ({
  getAll: async (req, res) => { try { res.json(await Model.findAll(extra || {})); } catch(e) { res.status(500).json({error:e.message}); } },
  create: async (req, res) => { try { res.json(await Model.create(req.body)); } catch(e) { res.status(500).json({error:e.message}); } },
  update: async (req, res) => { try { await Model.update(req.body,{where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } },
  remove: async (req, res) => { try { await Model.destroy({where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } },
});

// Programs
const p = crud(Program, { order: [['order','ASC']] });
router.get('/programs', A, p.getAll);
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
    res.json(await Recipe.create({ ...data, imageUrl, authorName: 'Кристина' }));
  } catch(e) { res.status(500).json({error:e.message}); }
});
router.put('/recipes/:id', A, async (req,res) => { try { await Recipe.update(req.body,{where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
router.delete('/recipes/:id', A, async (req,res) => { try { await Recipe.destroy({where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

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
