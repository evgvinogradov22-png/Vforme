const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Module = sequelize.define('Module', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  programId: { type: DataTypes.UUID, allowNull: false },
  title:     { type: DataTypes.STRING, allowNull: false },
  subtitle:  { type: DataTypes.STRING },
  num:       { type: DataTypes.STRING },
  color:     { type: DataTypes.STRING },
  order:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true });
module.exports = Module;
