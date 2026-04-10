const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const BroadcastHistory = sequelize.define('BroadcastHistory', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  adminId:       { type: DataTypes.UUID },
  message:       { type: DataTypes.TEXT, allowNull: false },
  channels:      { type: DataTypes.JSONB, defaultValue: [] },     // ["telegram", "max"]
  segment:       { type: DataTypes.STRING, defaultValue: 'all' }, // all, bought_program, club, etc.
  segmentFilter: { type: DataTypes.JSONB, defaultValue: {} },     // { programId: '...' }
  sentTg:        { type: DataTypes.INTEGER, defaultValue: 0 },
  sentMax:       { type: DataTypes.INTEGER, defaultValue: 0 },
  errorsTg:      { type: DataTypes.INTEGER, defaultValue: 0 },
  errorsMax:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true, indexes: [{ fields: ['createdAt'] }] });

module.exports = BroadcastHistory;
