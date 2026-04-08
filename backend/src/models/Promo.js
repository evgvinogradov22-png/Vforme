const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Promo = sequelize.define('Promo', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code:        { type: DataTypes.STRING, unique: true, allowNull: false },
  type:        { type: DataTypes.ENUM('percent', 'fixed'), defaultValue: 'percent' },
  value:       { type: DataTypes.INTEGER, allowNull: false }, // % или рубли
  maxUses:     { type: DataTypes.INTEGER, defaultValue: 0 },  // 0 = безлимит
  usedCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  programId:   { type: DataTypes.UUID },  // null = на все программы
  expiresAt:   { type: DataTypes.DATE },
}, { timestamps: true });

module.exports = Promo;
