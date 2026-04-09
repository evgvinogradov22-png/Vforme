const router = require('express').Router();
const UserProfile = require('../models/UserProfile');
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try { res.json(await UserProfile.findOne({ where: { userId: req.user.id } }) || {}); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    let p = await UserProfile.findOne({ where: { userId: req.user.id } });
    const snap = { date: new Date(), answers };
    if (!p) p = await UserProfile.create({ userId: req.user.id, answers, history: [snap] });
    else await p.update({ answers, history: [...(p.history || []), snap].slice(-50) });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/progress', auth, async (req, res) => {
  try { res.json(await UserProgress.findAll({ where: { userId: req.user.id } })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/progress', auth, async (req, res) => {
  try {
    const [r] = await UserProgress.upsert({ userId: req.user.id, ...req.body });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
