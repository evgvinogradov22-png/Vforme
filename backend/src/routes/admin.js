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

const p = crud(Program, { order: [['order','ASC']] });
router.get('/programs', A, p.getAll);
router.post('/programs', A, p.create);
router.put('/programs/:id', A, p.update);
router.delete('/programs/:id', A, p.remove);

const m = crud(Module);
router.post('/modules', A, m.create);
router.put('/modules/:id', A, m.update);
router.delete('/modules/:id', A, m.remove);

const l = crud(Lecture);
router.post('/lectures', A, l.create);
router.put('/lectures/:id', A, l.update);
router.delete('/lectures/:id', A, l.remove);

// Рецепты с загрузкой фото
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

// Схемы БАДов
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

// Пользователи (только суперадмин)
router.get('/users', SA, async (req,res) => { res.json(await User.findAll({attributes:{exclude:['password']}})); });
router.post('/users', SA, async (req,res) => {
  try {
    const { email, password, name, role: r } = req.body;
    const user = await User.create({ email, password: await bcrypt.hash(password,10), name, role: r });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch(e) { res.status(500).json({error:e.message}); }
});
router.put('/users/:id/role', SA, async (req,res) => { try { await User.update({role:req.body.role},{where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
router.delete('/users/:id', SA, async (req,res) => { try { await User.destroy({where:{id:req.params.id}}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

module.exports = router;
