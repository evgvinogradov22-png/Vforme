const router = require('express').Router();
const Program = require('../models/Program');
const Module = require('../models/Module');
const Lecture = require('../models/Lecture');

router.get('/', async (req, res) => {
  try {
    const programs = await Program.findAll({ order: [['order','ASC']] });
    const programIds = programs.map(p => p.id);

    // Batch: все модули и лекции за 2 запроса вместо N+1
    const modules = await Module.findAll({ where: { programId: programIds }, order: [['order','ASC']] });
    const moduleIds = modules.map(m => m.id);
    const lectures = await Lecture.findAll({ where: { moduleId: moduleIds }, order: [['order','ASC']] });

    // Group
    const lecturesByModule = {};
    lectures.forEach(l => { (lecturesByModule[l.moduleId] ||= []).push(l); });
    const modulesByProgram = {};
    modules.forEach(m => {
      const mj = m.toJSON();
      mj.lectures = lecturesByModule[m.id] || [];
      (modulesByProgram[m.programId] ||= []).push(mj);
    });

    res.json(programs.map(p => ({ ...p.toJSON(), modules: modulesByProgram[p.id] || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ error: 'Не найдено' });
    const modules = await Module.findAll({ where: { programId: req.params.id }, order: [['order','ASC']] });
    const moduleIds = modules.map(m => m.id);
    const lectures = await Lecture.findAll({ where: { moduleId: moduleIds }, order: [['order','ASC']] });

    const lecturesByModule = {};
    lectures.forEach(l => { (lecturesByModule[l.moduleId] ||= []).push(l); });

    res.json({
      ...program.toJSON(),
      modules: modules.map(m => ({ ...m.toJSON(), lectures: lecturesByModule[m.id] || [] })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
