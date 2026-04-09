const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Habit = sequelize.define('Habit', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  name:   { type: DataTypes.STRING, allowNull: false },
  icon:   { type: DataTypes.STRING },
  color:  { type: DataTypes.STRING },
  order:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  indexes: [{ fields: ['userId'] }],
});

module.exports = Habit;
