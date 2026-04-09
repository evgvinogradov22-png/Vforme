const router = require('express').Router();
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');
const RecipeLike = require('../models/RecipeLike');
const RecipeSave = require('../models/RecipeSave');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const upload = multer({ dest: '/tmp/' });

// Хелпер: добавить liked/saved для текущего пользователя
async function enrichRecipes(recipes, userId) {
  if (!userId) return recipes.map(r => ({ ...r.toJSON ? r.toJSON() : r, liked: false, saved: false }));
  const ids = recipes.map(r => r.id);
  const [likes, saves] = await Promise.all([
    RecipeLike.findAll({ where: { userId, recipeId: ids } }),
    RecipeSave.findAll({ where: { userId, recipeId: ids } }),
  ]);
  const likedSet = new Set(likes.map(l => l.recipeId));
  const savedSet = new Set(saves.map(s => s.recipeId));
  return recipes.map(r => ({
    ...(r.toJSON ? r.toJSON() : r),
    liked: likedSet.has(r.id),
    saved: savedSet.has(r.id),
  }));
}

router.get('/', async (req, res) => {
  try {
    const where = req.query.cat && req.query.cat !== 'Все' ? { cat: req.query.cat } : {};
    const list = await Recipe.findAll({ where, order: [['createdAt','DESC']] });
    // Если есть авторизация — обогащаем
    let userId = null;
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];
      if (token) userId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch {}
    res.json(await enrichRecipes(list, userId));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Сохранённые рецепты текущего пользователя
router.get('/saved/list', auth, async (req, res) => {
  try {
    const saves = await RecipeSave.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    const ids = saves.map(s => s.recipeId);
    if (ids.length === 0) return res.json([]);
    const recipes = await Recipe.findAll({ where: { id: ids } });
    // Сохраняем порядок saves
    const map = Object.fromEntries(recipes.map(r => [r.id, r]));
    const ordered = ids.map(id => map[id]).filter(Boolean);
    res.json(await enrichRecipes(ordered, req.user.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Случайный рецепт
router.get('/random/one', async (req, res) => {
  try {
    const count = await Recipe.count();
    if (count === 0) return res.json(null);
    const offset = Math.floor(Math.random() * count);
    const r = await Recipe.findOne({ offset });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Не найдено' });
    const comments = await Comment.findAll({ where: { recipeId: req.params.id }, order: [['createdAt','ASC']] });

    let liked = false, saved = false;
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const userId = jwt.verify(token, process.env.JWT_SECRET).id;
        const [l, s] = await Promise.all([
          RecipeLike.findOne({ where: { userId, recipeId: req.params.id } }),
          RecipeSave.findOne({ where: { userId, recipeId: req.params.id } }),
        ]);
        liked = !!l; saved = !!s;
      }
    } catch {}

    res.json({ ...recipe.toJSON(), comments, liked, saved });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    let data;
    try { data = JSON.parse(req.body.data || '{}'); } catch { return res.status(400).json({ error: 'Невалидный JSON' }); }
    let imageUrl = null;
    if (req.file) {
      const filename = `recipe_${Date.now()}.jpg`;
      const outDir = path.join(__dirname, '../../uploads');
      fs.mkdirSync(outDir, { recursive: true });
      await sharp(req.file.path).resize(1200).jpeg({ quality: 85 }).toFile(path.join(outDir, filename));
      fs.unlinkSync(req.file.path);
      imageUrl = `/uploads/${filename}`;
    }
    res.json(await Recipe.create({ ...data, imageUrl, authorId: req.user.id, authorName: data.authorName || 'Участница' }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Лайк — toggle, 1 пользователь = 1 лайк
router.post('/:id/like', auth, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const existing = await RecipeLike.findOne({ where: { userId, recipeId } });
    if (existing) {
      await existing.destroy();
      await Recipe.decrement('likes', { where: { id: recipeId } });
    } else {
      await RecipeLike.create({ userId, recipeId });
      await Recipe.increment('likes', { where: { id: recipeId } });
    }
    const r = await Recipe.findByPk(recipeId);
    res.json({ likes: Math.max(0, r.likes || 0), liked: !existing });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Сохранить / убрать из сохранённых — toggle
router.post('/:id/save', auth, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const existing = await RecipeSave.findOne({ where: { userId, recipeId } });
    if (existing) {
      await existing.destroy();
      res.json({ saved: false });
    } else {
      await RecipeSave.create({ userId, recipeId });
      res.json({ saved: true });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(await Comment.create({ recipeId: req.params.id, userId: req.user.id, userName: user.name || user.email, text: req.body.text }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
