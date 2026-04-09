const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Слишком много попыток. Подожди 15 минут' } });
const codeLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Слишком много попыток ввода кода' } });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const EmailToken = require('../models/EmailToken');
const { sendVerification, sendWelcome, sendPasswordReset, loggedSend } = require('../utils/email');

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function generateCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 цифр
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  return { code, hash };
}

router.post('/register', authLimit, async (req, res) => {
  const t = await require('../db').transaction();
  try {
    const { password, name } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !password) { await t.rollback(); return res.status(400).json({ error: 'Email и пароль обязательны' }); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { await t.rollback(); return res.status(400).json({ error: 'Некорректный email' }); }
    if (password.length < 6) { await t.rollback(); return res.status(400).json({ error: 'Пароль минимум 6 символов' }); }
    if (await User.findOne({ where: { email } })) { await t.rollback(); return res.status(400).json({ error: 'Email уже занят' }); }
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hash, name, emailVerified: false }, { transaction: t });
    await UserProfile.create({ userId: user.id }, { transaction: t });
    // Инвалидируем старые коды перед выдачей нового
    await EmailToken.update({ used: true }, { where: { userId: user.id, type: 'verify', used: false } });
    const { code, hash: codeHash } = generateCode();
    await EmailToken.create({ userId: user.id, tokenHash: codeHash, type: 'verify', expiresAt: new Date(Date.now() + 15 * 60 * 1000) }, { transaction: t });
    await t.commit();
    try { await loggedSend(sendVerification, 'verify', email, user.id, name, code); } catch (e) { console.error('Email error:', e.message); }
    const jwtToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: false } });
  } catch (e) { await t.rollback(); res.status(500).json({ error: e.message }); }
});

router.post('/login', authLimit, async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (user) {
      // Обновляем дату последнего захода (не блокируем ответ)
      user.update({ lastSeenAt: new Date() }).catch(() => {});
    }
    // Добавляем подписку + free picks
    const Subscription = require('../models/Subscription');
    const FreeProductPick = require('../models/FreeProductPick');
    const sub = await Subscription.findOne({ where: { userId: user.id } });
    const picks = await FreeProductPick.findAll({ where: { userId: user.id } });
    const userData = user.toJSON();
    const isActive = sub?.plan === 'club' && sub?.status === 'active' && (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
    userData.subscription = {
      plan: isActive ? 'club' : 'free',
      status: sub?.status || 'active',
      currentPeriodEnd: sub?.currentPeriodEnd || null,
    };
    userData.freePicks = picks.map(p => ({ productId: p.productId, productType: p.productType }));
    res.json(userData);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/verify-code', codeLimit, require('../middleware/auth'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Код не указан' });
    const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');
    const emailToken = await EmailToken.findOne({ where: { userId: req.user.id, tokenHash: codeHash, type: 'verify', used: false } });
    if (!emailToken || new Date(emailToken.expiresAt) < new Date()) return res.status(400).json({ error: 'Неверный или истёкший код' });
    await emailToken.update({ used: true });
    const user = await User.findByPk(req.user.id);
    await user.update({ emailVerified: true });
    try { await loggedSend(sendWelcome, 'welcome', user.email, user.id, user.name); } catch (e) {}
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/resend-verify', codeLimit, require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user.emailVerified) return res.json({ ok: true });
    await EmailToken.update({ used: true }, { where: { userId: user.id, type: 'verify', used: false } });
    const { code, hash: codeHash } = generateCode();
    await EmailToken.create({ userId: user.id, tokenHash: codeHash, type: 'verify', expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    await loggedSend(sendVerification, 'verify', user.email, user.id, user.name, code);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/forgot-password', authLimit, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ ok: true });
    await EmailToken.update({ used: true }, { where: { userId: user.id, type: 'reset', used: false } });
    const { token, hash: tokenHash } = generateToken();
    await EmailToken.create({ userId: user.id, tokenHash, type: 'reset', expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    try { await loggedSend(sendPasswordReset, 'reset', email, user.id, user.name, token); } catch (e) {}
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) return res.status(400).json({ error: 'Данные некорректны' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const emailToken = await EmailToken.findOne({ where: { tokenHash, type: 'reset', used: false } });
    if (!emailToken || new Date(emailToken.expiresAt) < new Date()) return res.status(400).json({ error: 'Ссылка истекла' });
    await emailToken.update({ used: true });
    const user = await User.findByPk(emailToken.userId);
    await user.update({ password: await bcrypt.hash(password, 12) });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Экспорт данных пользователя
router.get('/export', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'linkToken'] } });
    if (!user) return res.status(404).json({ error: 'Не найден' });
    const UserProfile = require('../models/UserProfile');
    const AtlasResult = require('../models/AtlasResult');
    const ChatMessage = require('../models/ChatMessage');
    const Order = require('../models/Order');
    const Points = require('../models/Points');
    const Habit = require('../models/Habit');
    const HabitLog = require('../models/HabitLog');
    const FreeProductPick = require('../models/FreeProductPick');
    const [profile, atlas, messages, orders, points, habits, habitLogs, picks] = await Promise.all([
      UserProfile.findOne({ where: { userId: req.user.id } }),
      AtlasResult.findAll({ where: { userId: req.user.id } }),
      ChatMessage.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'ASC']] }),
      Order.findAll({ where: { userId: req.user.id } }),
      Points.findAll({ where: { userId: req.user.id } }),
      Habit.findAll({ where: { userId: req.user.id } }),
      HabitLog.findAll({ where: { userId: req.user.id } }),
      FreeProductPick.findAll({ where: { userId: req.user.id } }),
    ]);
    res.json({
      exportDate: new Date().toISOString(),
      user: user.toJSON(),
      profile: profile?.toJSON() || null,
      atlasResults: atlas.map(a => a.toJSON()),
      chatMessages: messages.map(m => ({ role: m.role, content: m.content, date: m.createdAt })),
      orders: orders.map(o => o.toJSON()),
      points: points.map(p => p.toJSON()),
      habits: habits.map(h => h.toJSON()),
      habitLogs: habitLogs.map(l => l.toJSON()),
      freeProductPicks: picks.map(p => p.toJSON()),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Удаление аккаунта и всех данных
router.delete('/account', require('../middleware/auth'), async (req, res) => {
  try {
    const userId = req.user.id;
    const sequelize = require('../db');
    const t = await sequelize.transaction();
    try {
      const models = [
        require('../models/UserProfile'),
        require('../models/AtlasResult'),
        require('../models/ChatMessage'),
        require('../models/Order'),
        require('../models/Points'),
        require('../models/Habit'),
        require('../models/HabitLog'),
        require('../models/UserProgress'),
        require('../models/UserEvent'),
        require('../models/EmailLog'),
        require('../models/EmailToken'),
        require('../models/Task'),
        require('../models/Comment'),
        require('../models/RecipeLike'),
        require('../models/RecipeSave'),
        require('../models/Subscription'),
        require('../models/FreeProductPick'),
        require('../models/UserSupplement'),
        require('../models/ShoppingItem'),
        require('../models/ProtocolAccess'),
      ];
      for (const M of models) {
        await M.destroy({ where: { userId }, transaction: t });
      }
      await User.destroy({ where: { id: userId }, transaction: t });
      await t.commit();
      res.json({ ok: true, message: 'Аккаунт и все данные удалены' });
    } catch (txErr) { await t.rollback(); throw txErr; }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
