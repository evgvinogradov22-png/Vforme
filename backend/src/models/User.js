const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { encrypt, decrypt } = require('../utils/crypto');
const User = sequelize.define('User', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email:         { type: DataTypes.STRING, unique: true, allowNull: false },
  password:      { type: DataTypes.STRING, allowNull: false },
  name:          { type: DataTypes.STRING },
  role:          { type: DataTypes.ENUM('user','admin','superadmin'), defaultValue: 'user' },
  phone:         { type: DataTypes.STRING },
  avatar:        { type: DataTypes.STRING },
  programAccess: { type: DataTypes.JSONB, defaultValue: [] },
  emailVerified:  { type: DataTypes.BOOLEAN, defaultValue: false },
  telegramId:       { type: DataTypes.STRING },
  telegramBonusGiven: { type: DataTypes.BOOLEAN, defaultValue: false },
  telegramUsername:  { type: DataTypes.STRING },
  linkToken:         { type: DataTypes.STRING },
  linkTokenAt:       { type: DataTypes.DATE },
  lastSeenAt:        { type: DataTypes.DATE },
  chatSummary:       { type: DataTypes.TEXT },
  maxId:             { type: DataTypes.STRING },
  maxUsername:       { type: DataTypes.STRING },
  maxBonusGiven:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });

// Encrypt sensitive fields at rest
User.addHook('beforeCreate', (inst) => { if (inst.chatSummary) inst.chatSummary = encrypt(inst.chatSummary); });
User.addHook('beforeUpdate', (inst) => { if (inst.changed('chatSummary') && inst.chatSummary) inst.chatSummary = encrypt(inst.chatSummary); });
User.addHook('afterFind', (results) => {
  const list = Array.isArray(results) ? results : results ? [results] : [];
  list.forEach(r => { if (r.chatSummary) r.chatSummary = decrypt(r.chatSummary); });
});

module.exports = User;
