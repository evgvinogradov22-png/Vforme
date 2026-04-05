const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const UserProfile = sequelize.define('UserProfile', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:  { type: DataTypes.UUID, allowNull: false, unique: true },
  answers: { type: DataTypes.JSONB, defaultValue: {} },
  history: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true });
module.exports = UserProfile;
