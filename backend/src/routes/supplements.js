const router = require('express').Router();
const SupplementScheme = require('../models/SupplementScheme');
const Supplement = require('../models/Supplement');

router.get('/', async (req, res) => {
  try {
    const schemes = await SupplementScheme.findAll();
    res.json(await Promise.all(schemes.map(async s => ({
      ...s.toJSON(),
      items: await Supplement.findAll({ where: { schemeId: s.id }, order: [['order','ASC']] })
    }))));
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
