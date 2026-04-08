const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const EmailLog = sequelize.define('EmailLog', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID },
  to:        { type: DataTypes.STRING, allowNull: false },
  subject:   { type: DataTypes.STRING },
  type:      { type: DataTypes.STRING }, // verify, welcome, payment, reset
  status:    { type: DataTypes.ENUM('sent', 'error'), defaultValue: 'sent' },
  error:     { type: DataTypes.TEXT },
}, { timestamps: true });

module.exports = EmailLog;
