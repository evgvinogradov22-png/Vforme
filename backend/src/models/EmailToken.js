const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const crypto = require('crypto');

const EmailToken = sequelize.define('EmailToken', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING, allowNull: false }, // храним хэш, не сам токен
  type:      { type: DataTypes.ENUM('verify', 'reset'), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  used:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true, indexes: [{ fields: ['tokenHash', 'type', 'used'] }] });

module.exports = EmailToken;
