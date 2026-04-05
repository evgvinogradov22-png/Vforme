const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const UserProgress = sequelize.define('UserProgress', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  lectureId: { type: DataTypes.UUID, allowNull: false },
  checks:    { type: DataTypes.JSONB, defaultValue: {} },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });
module.exports = UserProgress;
