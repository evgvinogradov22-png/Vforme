const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const UserEvent = require('../models/UserEvent');
const { Op } = require('sequelize');

// POST — записать событие
router.post('/', auth, async (req, res) => {
  try {
    const { event, data, sessionId, duration } = req.body;
    if (!event) return res.status(400).json({ error: 'event обязателен' });
    await UserEvent.create({ userId: req.user.id, event, data: data || {}, sessionId, duration });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET — список событий для админки
router.get('/', [auth, role('admin', 'superadmin')], async (req, res) => {
  try {
    const { userId, event, from, to, limit = 100 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (event) where.event = event;
    if (from || to) where.createdAt = {
      ...(from ? { [Op.gte]: new Date(from) } : {}),
      ...(to ? { [Op.lte]: new Date(to) } : {}),
    };
    const events = await UserEvent.findAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit),
    });
    res.json(events);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
