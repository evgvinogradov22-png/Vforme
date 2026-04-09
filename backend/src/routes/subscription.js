const router = require('express').Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const FreeProductPick = require('../models/FreeProductPick');
const Order = require('../models/Order');
const User = require('../models/User');
const Protocol = require('../models/Protocol');
const SupplementScheme = require('../models/SupplementScheme');
const { isClubSubscriber, canAddFreePick, getUserFreePicks } = require('../utils/access');

const CLUB_PRICE = 399;

function buildSubscriptionPayUrl({ orderId, amount, userEmail }) {
  const domain = process.env.PRODAMUS_DOMAIN || 'nutrikris.payform.ru';
  const params = new URLSearchParams();
  params.set('do', 'pay');
  params.set('order_id', orderId);
  params.set('customer_extra', orderId);
  if (userEmail) params.set('customer_email', userEmail);
  params.set('products[0][name]', 'Клуб V Форме — месячная подписка');
  params.set('products[0][price]', String(amount));
  params.set('products[0][quantity]', '1');
  params.set('subscription', '1');
  params.set('urlSuccess', 'https://app.nutrikris.ru/?payment=success');
  params.set('urlReturn', 'https://app.nutrikris.ru/?payment=fail');
  params.set('sys', 'app.nutrikris.ru');
  return `https://${domain}/?${params.toString()}`;
}

// GET текущий статус подписки
router.get('/', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ where: { userId: req.user.id } });
    const picks = await getUserFreePicks(req.user.id);
    const isClub = sub?.plan === 'club' && sub?.status === 'active' && (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
    res.json({
      plan: isClub ? 'club' : 'free',
      status: sub?.status || 'active',
      currentPeriodEnd: sub?.currentPeriodEnd || null,
      cancelledAt: sub?.cancelledAt || null,
      freePicks: picks.map(p => ({ productId: p.productId, productType: p.productType })),
      freePicksCount: picks.length,
      freePicksMax: 3,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST оформить подписку
router.post('/subscribe', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const orderId = `sub_${req.user.id}_${Date.now()}`;
    await Order.create({ orderId, userId: req.user.id, programId: req.user.id, amount: CLUB_PRICE, type: 'subscription' });
    const payUrl = buildSubscriptionPayUrl({ orderId, amount: CLUB_PRICE, userEmail: user?.email });
    res.json({ orderId, amount: CLUB_PRICE, payUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST отменить подписку
router.post('/cancel', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ where: { userId: req.user.id, plan: 'club' } });
    if (!sub) return res.status(404).json({ error: 'Подписка не найдена' });
    await sub.update({ status: 'cancelled', cancelledAt: new Date() });
    res.json({ ok: true, activeUntil: sub.currentPeriodEnd });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST выбрать бесплатный продукт
router.post('/free-pick', auth, async (req, res) => {
  try {
    const { productId, productType } = req.body;
    if (!productId || !productType) return res.status(400).json({ error: 'productId и productType обязательны' });
    if (!['protocol', 'scheme'].includes(productType)) return res.status(400).json({ error: 'Тип: protocol или scheme' });

    // Проверка что продукт существует
    if (productType === 'protocol') {
      const p = await Protocol.findByPk(productId);
      if (!p) return res.status(404).json({ error: 'Продукт не найден' });
    } else {
      const s = await SupplementScheme.findByPk(productId);
      if (!s) return res.status(404).json({ error: 'Продукт не найден' });
    }

    if (!(await canAddFreePick(req.user.id))) return res.status(403).json({ error: 'Лимит 3 бесплатных продукта' });

    const [pick] = await FreeProductPick.findOrCreate({
      where: { userId: req.user.id, productId, productType },
      defaults: { userId: req.user.id, productId, productType },
    });
    res.json(pick);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE убрать бесплатный продукт
router.delete('/free-pick/:productId', auth, async (req, res) => {
  try {
    await FreeProductPick.destroy({ where: { userId: req.user.id, productId: req.params.productId } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
