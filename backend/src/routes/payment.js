require('dotenv').config();
const router = require('express').Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Points = require('../models/Points');
const Order = require('../models/Order');
const Program = require('../models/Program');
const Promo = require('../models/Promo');
const { sendPaymentConfirm, loggedSend } = require('../utils/email');
const sequelize = require('../db');

// GET — для проверки Prodamus
router.get('/webhook', (req, res) => res.json({ ok: true }));

// Бесплатный доступ к программе
router.post('/free', auth, async (req, res) => {
  try {
    const { programId } = req.body;
    if (!programId) return res.status(400).json({ error: 'programId обязателен' });
    const program = await Program.findByPk(programId);
    if (!program) return res.status(404).json({ error: 'Программа не найдена' });
    if (!program.available) return res.status(403).json({ error: 'Программа недоступна' });
    if (program.price > 0) return res.status(403).json({ error: 'Программа платная' });
    const t = await sequelize.transaction();
    try {
      const user = await User.findByPk(req.user.id, { lock: true, transaction: t });
      const current = user.programAccess || [];
      if (!current.includes(programId)) {
        await user.update({ programAccess: [...current, programId] }, { transaction: t });
        await Points.create({ userId: user.id, amount: 10, reason: 'free_program', refId: programId, refType: 'program' }, { transaction: t });
      }
      await t.commit();
    } catch (txErr) { await t.rollback(); throw txErr; }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Построить полный URL на форму оплаты Prodamus
function buildPayUrl({ orderId, amount, productName, userEmail }) {
  const domain = process.env.PRODAMUS_DOMAIN || 'nutrikris.payform.ru';
  const params = new URLSearchParams();
  params.set('do', 'pay');
  params.set('order_id', orderId);
  params.set('customer_extra', orderId);
  if (userEmail) params.set('customer_email', userEmail);
  params.set('products[0][name]', productName);
  params.set('products[0][price]', String(amount));
  params.set('products[0][quantity]', '1');
  params.set('urlSuccess', 'https://app.nutrikris.ru/?payment=success');
  params.set('urlReturn', 'https://app.nutrikris.ru/?payment=fail');
  params.set('sys', 'app.nutrikris.ru');
  return `https://${domain}/?${params.toString()}`;
}

// Создать pending-заказ перед оплатой
async function createOrder(req, res) {
  try {
    const { programId, promoId } = req.body;
    if (!programId) return res.status(400).json({ error: 'programId обязателен' });
    const program = await Program.findByPk(programId);
    if (!program) return res.status(404).json({ error: 'Программа не найдена' });
    if (!program.available) return res.status(403).json({ error: 'Программа недоступна' });

    let finalPrice = program.price;
    if (promoId) {
      const promo = await Promo.findByPk(promoId);
      if (promo && promo.active) {
        if (promo.type === 'percent') finalPrice = Math.round(finalPrice * (1 - promo.value / 100));
        if (promo.type === 'fixed') finalPrice = Math.max(0, finalPrice - promo.value);
      }
    }

    const orderId = `${req.user.id}_${programId}_${Date.now()}`;
    const user = await User.findByPk(req.user.id);
    await Order.create({ orderId, userId: req.user.id, programId, amount: finalPrice, promoId: promoId || null });
    const payUrl = buildPayUrl({ orderId, amount: finalPrice, productName: program.title, userEmail: user?.email });
    res.json({ orderId, amount: finalPrice, payUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.post('/create', auth, createOrder);
router.post('/prepare', auth, createOrder);

// Создать заказ для протокола
router.post('/create-protocol', auth, async (req, res) => {
  try {
    const { protocolId, promoId } = req.body;
    if (!protocolId) return res.status(400).json({ error: 'protocolId обязателен' });
    const Protocol = require('../models/Protocol');
    const protocol = await Protocol.findByPk(protocolId);
    if (!protocol) return res.status(404).json({ error: 'Протокол не найден' });
    if (!protocol.available) return res.status(403).json({ error: 'Протокол недоступен' });

    let finalPrice = protocol.price;
    if (promoId) {
      const promo = await Promo.findByPk(promoId);
      if (promo && promo.active) {
        if (promo.type === 'percent') finalPrice = Math.round(finalPrice * (1 - promo.value / 100));
        if (promo.type === 'fixed') finalPrice = Math.max(0, finalPrice - promo.value);
      }
    }

    const orderId = `protocol_${req.user.id}_${protocolId}_${Date.now()}`;
    const user = await User.findByPk(req.user.id);
    await Order.create({ orderId, userId: req.user.id, programId: protocolId, amount: finalPrice, promoId: promoId || null, type: 'protocol' });
    const payUrl = buildPayUrl({ orderId, amount: finalPrice, productName: protocol.title, userEmail: user?.email });
    res.json({ orderId, amount: finalPrice, payUrl });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Webhook от Prodamus
router.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('Prodamus webhook:', JSON.stringify(data));

    // Проверка подписи
    const secret = process.env.PRODAMUS_SECRET;
    if (secret) {
      const sign = req.headers['x-signature'] || req.headers['sign'] || data.sign;
      if (!sign) {
        console.error('Webhook: подпись отсутствует');
        return res.status(401).json({ error: 'No signature' });
      }
      const body = { ...data };
      delete body.sign;
      const str = Object.keys(body).sort().map(k => `${k}=${body[k]}`).join('&');
      const expected = crypto.createHmac('sha256', secret).update(str).digest('hex');
      if (sign !== expected) {
        console.error('Webhook: неверная подпись. Received:', sign, 'Expected:', expected);
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    if (data.payment_status !== 'success') return res.json({ ok: true });

    const email = data.customer_email || data.email;
    if (!email) return res.json({ ok: true });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('Webhook: пользователь не найден по email:', email);
      return res.json({ ok: true });
    }

    // Ищем заказ — сначала по orderId, потом по сумме
    // Prodamus присылает наш orderId в customer_extra
    const orderId = data.customer_extra || data.order_id || data.orderId;
    let order = null;

    if (orderId) {
      order = await Order.findOne({ where: { orderId, status: 'pending' } });
      if (!order) {
        // Prodamus может прислать свой orderId отличный от нашего
        // Пробуем найти по userId + сумме
        console.log('Order not found by orderId:', orderId, '- trying by amount');
      }
    }

    if (!order) {
      const { Op } = require('sequelize');
      const amount = parseFloat(data.sum || data.amount || 0);
      if (amount > 0) {
        order = await Order.findOne({
          where: { userId: user.id, status: 'pending', amount, createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          order: [['createdAt', 'DESC']],
        });
      }
    }

    if (!order) {
      console.error('Webhook: заказ не найден для', email);
      return res.json({ ok: true });
    }

    const isProtocol = order.type === 'protocol' || (order.orderId && order.orderId.startsWith('protocol_'));
    const itemId = order.programId;
    const t = await sequelize.transaction();
    try {
      await order.update({ status: 'paid' }, { transaction: t });

      if (order.promoId) {
        const promo = await Promo.findByPk(order.promoId);
        if (promo) await promo.increment('usedCount', { transaction: t });
      }

      if (isProtocol) {
        const ProtocolAccess = require('../models/ProtocolAccess');
        await ProtocolAccess.findOrCreate({ where: { userId: user.id, protocolId: itemId }, defaults: { userId: user.id, protocolId: itemId }, transaction: t });
        await Points.create({ userId: user.id, amount: 50, reason: 'protocol_purchase', refId: itemId, refType: 'protocol' }, { transaction: t });
      } else {
        const current = user.programAccess || [];
        if (!current.includes(itemId)) {
          await user.update({ programAccess: [...current, itemId] }, { transaction: t });
          await Points.create({ userId: user.id, amount: 50, reason: 'program_purchase', refId: itemId, refType: 'program' }, { transaction: t });
        }
      }

      await t.commit();
      console.log(`✅ ${isProtocol ? 'Протокол' : 'Программа'} ${itemId} открыта для ${email}`);

      // Письмо об оплате
      try {
        const prog = isProtocol
          ? await require('../models/Protocol').findByPk(itemId)
          : await Program.findByPk(itemId);
        await loggedSend(sendPaymentConfirm, 'payment_confirm', user.email, user.id, user.name, prog?.title || 'Продукт', order.amount);
      } catch(emailErr) {
        console.error('Payment confirm email error:', emailErr.message);
      }

    } catch(txErr) {
      await t.rollback();
      console.error('Webhook transaction failed:', txErr.message);
      return res.status(500).json({ error: 'Transaction failed' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
