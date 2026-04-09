const router = require('express').Router();
const SupplementScheme = require('../models/SupplementScheme');
const Supplement = require('../models/Supplement');

router.get('/', async (req, res) => {
  try {
    const schemes = await SupplementScheme.findAll();
    const schemeIds = schemes.map(s => s.id);
    const allSupps = schemeIds.length > 0 ? await Supplement.findAll({ where: { schemeId: schemeIds }, order: [['order','ASC']] }) : [];
    const byScheme = {};
    allSupps.forEach(s => { (byScheme[s.schemeId] ||= []).push(s); });
    res.json(schemes.map(s => ({ ...s.toJSON(), items: byScheme[s.id] || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/schemes/:id', async (req, res) => {
  try {
    const scheme = await SupplementScheme.findByPk(req.params.id);
    if (!scheme) return res.status(404).json({ error: 'Не найдено' });
    const items = await Supplement.findAll({ where: { schemeId: req.params.id }, order: [['order','ASC']] });
    res.json({ ...scheme.toJSON(), items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
