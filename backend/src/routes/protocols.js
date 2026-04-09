const router = require('express').Router();
const auth = require('../middleware/auth');
const Protocol = require('../models/Protocol');
const ProtocolAccess = require('../models/ProtocolAccess');
const Supplement = require('../models/Supplement');
const Points = require('../models/Points');
const { isClubSubscriber, getUserFreePicks } = require('../utils/access');

// GET all protocols (public list)
router.get('/', auth, async (req, res) => {
  try {
    const protocols = await Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] });
    const access = await ProtocolAccess.findAll({ where: { userId: req.user.id } });
    const accessIds = access.map(a => a.protocolId);

    // Batch: все supplement IDs за 1 запрос
    const allSuppIds = [];
    protocols.forEach(p => {
      const sups = p.toJSON().supplements || [];
      sups.forEach(s => { if (s.supplementId) allSuppIds.push(s.supplementId); });
    });
    const supps = allSuppIds.length > 0 ? await Supplement.findAll({ where: { id: [...new Set(allSuppIds)] } }) : [];
    const suppMap = {};
    supps.forEach(s => { suppMap[s.id] = s; });

    const isClub = await isClubSubscriber(req.user.id);
    const picks = await getUserFreePicks(req.user.id);
    const pickIds = picks.map(p => p.productId);

    const result = protocols.map(p => {
      const proto = p.toJSON();
      proto.hasAccess = accessIds.includes(proto.id) || isClub || pickIds.includes(proto.id);
      if (proto.supplements?.length) {
        proto.supplements = proto.supplements.map(s => ({
          ...s,
          supplement: suppMap[s.supplementId] || null,
        }));
      }
      return proto;
    });

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single protocol
router.get('/:id', auth, async (req, res) => {
  try {
    const proto = await Protocol.findByPk(req.params.id);
    if (!proto) return res.status(404).json({ error: 'Не найдено' });

    const access = await ProtocolAccess.findOne({ where: { userId: req.user.id, protocolId: proto.id } });
    const isClub2 = await isClubSubscriber(req.user.id);
    const pick = await require('../models/FreeProductPick').findOne({ where: { userId: req.user.id, productId: proto.id, productType: 'protocol' } });
    const hasAccess = !!access || isClub2 || !!pick;

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
