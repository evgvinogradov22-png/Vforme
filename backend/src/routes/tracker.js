const router = require('express').Router();
const HabitLog = require('../models/HabitLog');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

router.get('/habits', auth, async (req, res) => {
  try { res.json(await HabitLog.findAll({ where: { userId: req.user.id } })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/habits', auth, async (req, res) => {
  try { const [r] = await HabitLog.upsert({ userId: req.user.id, ...req.body }); res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
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
