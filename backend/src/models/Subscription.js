const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Subscription = sequelize.define('Subscription', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:             { type: DataTypes.UUID, allowNull: false, unique: true },
  plan:               { type: DataTypes.STRING, defaultValue: 'free' }, // free | club
  status:             { type: DataTypes.STRING, defaultValue: 'active' }, // active | cancelled | expired
  prodamusSubId:      { type: DataTypes.STRING },
  currentPeriodStart: { type: DataTypes.DATE },
  currentPeriodEnd:   { type: DataTypes.DATE },
  cancelledAt:        { type: DataTypes.DATE },
}, { timestamps: true, indexes: [{ unique: true, fields: ['userId'] }] });

module.exports = Subscription;
