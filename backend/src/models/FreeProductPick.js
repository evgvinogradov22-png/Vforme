const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const FreeProductPick = sequelize.define('FreeProductPick', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:      { type: DataTypes.UUID, allowNull: false },
  productId:   { type: DataTypes.UUID, allowNull: false },
  productType: { type: DataTypes.STRING, allowNull: false }, // protocol | scheme
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'productId', 'productType'] },
    { fields: ['userId'] },
  ],
});

module.exports = FreeProductPick;
