const router = require('express').Router();
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const upload = multer({ dest: '/tmp/' });

router.get('/', async (req, res) => {
  try {
    const where = req.query.cat && req.query.cat !== 'Все' ? { cat: req.query.cat } : {};
    res.json(await Recipe.findAll({ where, order: [['createdAt','DESC']] }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Не найдено' });
    const comments = await Comment.findAll({ where: { recipeId: req.params.id }, order: [['createdAt','ASC']] });
    res.json({ ...recipe.toJSON(), comments });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
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
    res.json(await Recipe.create({ ...data, imageUrl, authorId: req.user.id, authorName: data.authorName || 'Участница' }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    await Recipe.increment('likes', { where: { id: req.params.id } });
    const r = await Recipe.findByPk(req.params.id);
    res.json({ likes: r.likes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(await Comment.create({ recipeId: req.params.id, userId: req.user.id, userName: user.name || user.email, text: req.body.text }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
