const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// Добавки, которые пользователь сам добавил в свой трекер
const UserSupplement = sequelize.define('UserSupplement', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:         { type: DataTypes.UUID, allowNull: false },
  name:           { type: DataTypes.STRING, allowNull: false },
  dose:           { type: DataTypes.STRING },
  time:           { type: DataTypes.STRING },          // 'утром' | 'до_завтрака' | 'после_обеда' | 'перед_сном' ...
  course:         { type: DataTypes.STRING },          // '30 дней', 'постоянно' и т.п.
  recommendation: { type: DataTypes.TEXT },            // AI-рекомендация
}, {
  timestamps: true,
  indexes: [{ fields: ['userId'] }],
});

module.exports = UserSupplement;
