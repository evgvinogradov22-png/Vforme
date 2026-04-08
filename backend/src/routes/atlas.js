const router = require('express').Router();
const auth = require('../middleware/auth');
const AtlasResult = require('../models/AtlasResult');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { analyzeAnswers, loadCatalog } = require('../utils/atlasAnalyze');
const { sendToUser, broadcast } = require('../ws');

// Прохождение анкеты: считаем AI-анализ и сохраняем в БД.
router.post('/submit', auth, async (req, res) => {
  try {
    const { answers = {}, complaints = '', levels = {} } = req.body || {};

    const ai = await analyzeAnswers({ answers, complaints, levels });

    const row = await AtlasResult.create({
      userId: req.user.id,
      answers,
      complaints: complaints || null,
      levels,
      aiMessage: ai.message,
      focusZoneIds: ai.focusZoneIds,
      recommendedTitles: ai.recommendedTitles,
      gender: answers.gender || null,
    });

    // Дублируем сообщение Кристины в чат пользователя — чтобы то же сообщение
    // лежало в истории чата и клиент мог ответить.
    try {
      const chatMsg = await ChatMessage.create({
        userId: req.user.id,
        role: 'admin',
        content: ai.message || '—',
        isAi: false,
      });
      sendToUser(req.user.id, { type: 'chat_message', message: chatMsg });
      broadcast({ type: 'chat_admin_update', userId: req.user.id, message: chatMsg });
    } catch (e) {
      console.error('Atlas → chat duplication error:', e.message);
    }

    res.json({
      id: row.id,
      createdAt: row.createdAt,
      answers, complaints, levels,
      message: ai.message,
      focusZoneIds: ai.focusZoneIds,
      recommendedTitles: ai.recommendedTitles,
    });
  } catch (e) {
    console.error('Atlas submit error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Последний результат текущего пользователя
router.get('/me', auth, async (req, res) => {
  try {
    const row = await AtlasResult.findOne({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    if (!row) return res.json(null);
    res.json({
      id: row.id,
      createdAt: row.createdAt,
      answers: row.answers,
      complaints: row.complaints,
      levels: row.levels,
      message: row.aiMessage,
      focusZoneIds: row.focusZoneIds,
      recommendedTitles: row.recommendedTitles,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// История всех прохождений
router.get('/history', auth, async (req, res) => {
  try {
    const rows = await AtlasResult.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'createdAt', 'levels', 'focusZoneIds'],
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Каталог контента для вкладки Атлас (такой же формат как у playground)
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
