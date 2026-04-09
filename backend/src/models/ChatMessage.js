const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ChatMessage = sequelize.define('ChatMessage', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  role:      { type: DataTypes.ENUM('user', 'assistant', 'admin'), allowNull: false },
  content:   { type: DataTypes.TEXT, allowNull: false },
  isAi:      { type: DataTypes.BOOLEAN, defaultValue: true }, // true = AI ответил, false = admin вручную
  summarized: { type: DataTypes.BOOLEAN, defaultValue: false }, // включено в summary, не передаётся LLM напрямую
}, { timestamps: true, indexes: [{ fields: ['userId', 'createdAt'] }] });

module.exports = ChatMessage;
