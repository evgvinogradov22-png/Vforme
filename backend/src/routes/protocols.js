const router = require('express').Router();
const auth = require('../middleware/auth');
const Protocol = require('../models/Protocol');
const ProtocolAccess = require('../models/ProtocolAccess');
const Supplement = require('../models/Supplement');
const Points = require('../models/Points');

// GET all protocols (public list)
router.get('/', auth, async (req, res) => {
  try {
    const protocols = await Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] });
    const access = await ProtocolAccess.findAll({ where: { userId: req.user.id } });
    const accessIds = access.map(a => a.protocolId);

    const result = await Promise.all(protocols.map(async p => {
      const proto = p.toJSON();
      proto.hasAccess = proto.price === 0 || accessIds.includes(proto.id);

      // Attach supplement details
      if (proto.supplements?.length) {
        const suppIds = proto.supplements.map(s => s.supplementId).filter(Boolean);
        const supps = await Supplement.findAll({ where: { id: suppIds } });
        proto.supplements = proto.supplements.map(s => ({
          ...s,
          supplement: supps.find(x => x.id === s.supplementId) || null,
        }));
      }
      return proto;
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single protocol
router.get('/:id', auth, async (req, res) => {
  try {
    const proto = await Protocol.findByPk(req.params.id);
    if (!proto) return res.status(404).json({ error: 'Не найдено' });

    const access = await ProtocolAccess.findOne({ where: { userId: req.user.id, protocolId: proto.id } });
    const hasAccess = proto.price === 0 || !!access;

    const data = proto.toJSON();
    data.hasAccess = hasAccess;

    if (data.supplements?.length) {
      const suppIds = data.supplements.map(s => s.supplementId).filter(Boolean);
      const supps = await Supplement.findAll({ where: { id: suppIds } });
      data.supplements = data.supplements.map(s => ({
        ...s,
        supplement: supps.find(x => x.id === s.supplementId) || null,
      }));
    }

    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST free access
router.post('/:id/access/free', auth, async (req, res) => {
  try {
    const proto = await Protocol.findByPk(req.params.id);
    if (!proto) return res.status(404).json({ error: 'Не найдено' });
    if (proto.price > 0) return res.status(403).json({ error: 'Протокол платный' });

    await ProtocolAccess.findOrCreate({ where: { userId: req.user.id, protocolId: proto.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
