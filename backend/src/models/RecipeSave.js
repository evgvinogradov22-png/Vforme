const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// Сохранённые пользователем рецепты
const RecipeSave = sequelize.define('RecipeSave', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:   { type: DataTypes.UUID, allowNull: false },
  recipeId: { type: DataTypes.UUID, allowNull: false },
}, {
  timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'recipeId'] }],
});

module.exports = RecipeSave;
