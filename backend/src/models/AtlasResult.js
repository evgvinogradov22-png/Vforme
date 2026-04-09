const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { encrypt, decrypt } = require('../utils/crypto');

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

// Encrypt health data at rest
const SENSITIVE = ['complaints', 'aiMessage', 'gender'];
AtlasResult.addHook('beforeCreate', (inst) => { SENSITIVE.forEach(f => { if (inst[f]) inst[f] = encrypt(inst[f]); }); });
AtlasResult.addHook('beforeUpdate', (inst) => { SENSITIVE.forEach(f => { if (inst.changed(f)) inst[f] = encrypt(inst[f]); }); });
AtlasResult.addHook('afterFind', (results) => {
  const list = Array.isArray(results) ? results : results ? [results] : [];
  list.forEach(r => { SENSITIVE.forEach(f => { if (r[f]) r[f] = decrypt(r[f]); }); });
});

module.exports = AtlasResult;
