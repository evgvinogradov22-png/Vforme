const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// Результат прохождения атласа здоровья (анкета + AI-анализ).
// Храним каждый submit — у одного пользователя может быть история.
const AtlasResult = sequelize.define('AtlasResult', {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:            { type: DataTypes.UUID, allowNull: false },
  answers:           { type: DataTypes.JSONB, defaultValue: {} },
  complaints:        { type: DataTypes.TEXT },
  levels:            { type: DataTypes.JSONB, defaultValue: {} },
  aiMessage:         { type: DataTypes.TEXT },
  focusZoneIds:      { type: DataTypes.JSONB, defaultValue: [] },
  recommendedTitles: { type: DataTypes.JSONB, defaultValue: [] },
  gender:            { type: DataTypes.STRING(16) },
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = AtlasResult;
