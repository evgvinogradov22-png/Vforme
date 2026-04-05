const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const HabitLog = sequelize.define('HabitLog', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  date:   { type: DataTypes.DATEONLY, allowNull: false },
  log:    { type: DataTypes.JSONB, defaultValue: {} },
}, { timestamps: true });
module.exports = HabitLog;
