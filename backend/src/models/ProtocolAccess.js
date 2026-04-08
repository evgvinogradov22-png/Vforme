const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ProtocolAccess = sequelize.define('ProtocolAccess', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:     { type: DataTypes.UUID, allowNull: false },
  protocolId: { type: DataTypes.UUID, allowNull: false },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'protocolId'] }
  ]
});

module.exports = ProtocolAccess;
