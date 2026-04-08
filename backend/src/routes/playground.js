// Playground — прототип атласа здоровья без авторизации.
// Переиспользует общую логику из utils/atlasAnalyze.js.
const router = require('express').Router();
const { analyzeAnswers } = require('../utils/atlasAnalyze');

router.post('/analyze', async (req, res) => {
  try {
    const { answers = {}, complaints = '', levels = {} } = req.body || {};
    const result = await analyzeAnswers({ answers, complaints, levels });
    res.json(result);
  } catch (e) {
    console.error('Playground analyze error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/content', async (req, res) => {
  try {
    const Program = require('../models/Program');
    const Protocol = require('../models/Protocol');
    const [programs, protocols] = await Promise.all([
      Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }),
      Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }),
    ]);
    const items = [
      ...programs.map(p => ({ id: p.id, kind: 'program', title: p.title, desc: p.desc, price: Number(p.price) || 0, icon: p.icon || '📚' })),
      ...protocols.map(p => ({ id: p.id, kind: 'protocol', title: p.title, desc: p.description || '', price: Number(p.price) || 0, icon: '📋' })),
    ];
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
