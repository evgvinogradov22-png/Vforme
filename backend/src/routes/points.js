const router = require('express').Router();
const auth = require('../middleware/auth');
const Points = require('../models/Points');
const { Sequelize } = require('sequelize');

// Получить баллы текущего юзера
router.get('/', auth, async (req, res) => {
  try {
    const rows = await Points.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    const total = rows.reduce((s, r) => s + r.amount, 0);
    res.json({ total, history: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Начислить баллы (вызывается при завершении лекции)
router.post('/award', auth, async (req, res) => {
  try {
    const { amount, reason, refId, refType } = req.body;
    // Проверяем что не начисляли уже за это
    const exists = await Points.findOne({ where: { userId: req.user.id, refId, refType } });
    if (exists) return res.json({ ok: true, alreadyAwarded: true });
    const point = await Points.create({ userId: req.user.id, amount, reason, refId, refType });
    res.json({ ok: true, point });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
