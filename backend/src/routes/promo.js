const router = require('express').Router();
const auth = require('../middleware/auth');
const Promo = require('../models/Promo');

// Проверить промокод
router.post('/check', auth, async (req, res) => {
  try {
    const { code, programId, price } = req.body;
    const promo = await Promo.findOne({ where: { code: code.toUpperCase(), active: true } });

    if (!promo) return res.status(404).json({ error: 'Промокод не найден' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(400).json({ error: 'Промокод истёк' });
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Промокод исчерпан' });
    if (promo.programId && promo.programId !== programId) return res.status(400).json({ error: 'Промокод не действует для этой программы' });

    const discount = promo.type === 'percent'
      ? Math.round(price * promo.value / 100)
      : Math.min(promo.value, price);

    const finalPrice = Math.max(0, price - discount);

    res.json({
      valid: true,
      promoId: promo.id,
      type: promo.type,
      value: promo.value,
      discount,
      finalPrice,
      message: promo.type === 'percent' ? `Скидка ${promo.value}%` : `Скидка ${promo.value} ₽`,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
