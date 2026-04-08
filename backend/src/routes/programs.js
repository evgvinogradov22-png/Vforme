const router = require('express').Router();
const Program = require('../models/Program');
const Module = require('../models/Module');
const Lecture = require('../models/Lecture');

router.get('/', async (req, res) => {
  try {
    const programs = await Program.findAll({ order: [['order','ASC']] });
    const result = await Promise.all(programs.map(async prog => {
      const modules = await Module.findAll({ where: { programId: prog.id }, order: [['order','ASC']] });
      const modulesWithLectures = await Promise.all(modules.map(async m => ({
        ...m.toJSON(),
        lectures: await Lecture.findAll({ where: { moduleId: m.id }, order: [['order','ASC']] })
      })));
      return { ...prog.toJSON(), modules: modulesWithLectures };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ error: 'Не найдено' });
    const modules = await Module.findAll({ where: { programId: req.params.id }, order: [['order','ASC']] });
    const modulesWithLectures = await Promise.all(modules.map(async m => ({
      ...m.toJSON(),
      lectures: await Lecture.findAll({ where: { moduleId: m.id }, order: [['order','ASC']] })
    })));
    res.json({ ...program.toJSON(), modules: modulesWithLectures });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
