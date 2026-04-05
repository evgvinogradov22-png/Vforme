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

module.exports = router;
