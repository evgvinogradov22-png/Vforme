const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ShoppingItem = sequelize.define('ShoppingItem', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:     { type: DataTypes.UUID, allowNull: false },
  name:       { type: DataTypes.STRING, allowNull: false },
  category:   { type: DataTypes.STRING },    // 'ingredient' | 'supplement'
  source:     { type: DataTypes.STRING },    // рецепт / протокол / схема — текст
  sourceId:   { type: DataTypes.UUID },
  done:       { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  indexes: [{ fields: ['userId'] }],
});

module.exports = ShoppingItem;
