const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ChatSettings = sequelize.define('ChatSettings', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  systemPrompt: { type: DataTypes.TEXT, defaultValue: '' },
  assistantName: { type: DataTypes.STRING, defaultValue: 'Кристина' },
  welcomeMessage: { type: DataTypes.TEXT, defaultValue: 'Привет! Я Кристина. Чем могу помочь?' },
  enabled:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, { timestamps: true });

module.exports = ChatSettings;
