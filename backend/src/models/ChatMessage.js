const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { encrypt, decrypt } = require('../utils/crypto');

const ChatMessage = sequelize.define('ChatMessage', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  role:      { type: DataTypes.ENUM('user', 'assistant', 'admin'), allowNull: false },
  content:   { type: DataTypes.TEXT, allowNull: false },
  isAi:      { type: DataTypes.BOOLEAN, defaultValue: true }, // true = AI ответил, false = admin вручную
  summarized: { type: DataTypes.BOOLEAN, defaultValue: false }, // включено в summary, не передаётся LLM напрямую
}, { timestamps: true, indexes: [{ fields: ['userId', 'createdAt'] }] });

// Encrypt chat messages at rest
ChatMessage.addHook('beforeCreate', (inst) => { if (inst.content) inst.content = encrypt(inst.content); });
ChatMessage.addHook('beforeUpdate', (inst) => { if (inst.changed('content')) inst.content = encrypt(inst.content); });
ChatMessage.addHook('afterFind', (results) => {
  const list = Array.isArray(results) ? results : results ? [results] : [];
  list.forEach(r => { if (r.content) r.content = decrypt(r.content); });
});

module.exports = ChatMessage;
