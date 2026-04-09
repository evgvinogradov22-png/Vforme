const Subscription = require('../models/Subscription');
const FreeProductPick = require('../models/FreeProductPick');
const ProtocolAccess = require('../models/ProtocolAccess');
const User = require('../models/User');

async function isClubSubscriber(userId) {
  const sub = await Subscription.findOne({ where: { userId, plan: 'club', status: 'active' } });
  if (!sub) return false;
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    await sub.update({ status: 'expired' });
    return false;
  }
  return true;
}

async function hasProductAccess(userId, productId, productType) {
  // 1. Club = всё открыто
  if (await isClubSubscriber(userId)) return true;

  // 2. Прямая покупка
  if (productType === 'program') {
    const user = await User.findByPk(userId, { attributes: ['programAccess'] });
    if ((user?.programAccess || []).includes(productId)) return true;
  }
  if (productType === 'protocol') {
    const access = await ProtocolAccess.findOne({ where: { userId, protocolId: productId } });
    if (access) return true;
  }

  // 3. Free pick
  const pick = await FreeProductPick.findOne({ where: { userId, productId, productType } });
  if (pick) return true;

  return false;
}

async function getUserFreePicks(userId) {
  return FreeProductPick.findAll({ where: { userId } });
}

async function canAddFreePick(userId) {
  const count = await FreeProductPick.count({ where: { userId } });
  return count < 3;
}

async function getFreePickCount(userId) {
  return FreeProductPick.count({ where: { userId } });
}

module.exports = { isClubSubscriber, hasProductAccess, getUserFreePicks, canAddFreePick, getFreePickCount };
