const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Program = sequelize.define('Program', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:     { type: DataTypes.STRING, allowNull: false },
  subtitle:  { type: DataTypes.STRING },
  desc:      { type: DataTypes.TEXT },
  icon:      { type: DataTypes.STRING },
  color:     { type: DataTypes.STRING },
  available: { type: DataTypes.BOOLEAN, defaultValue: false },
  price:     { type: DataTypes.INTEGER, defaultValue: 0 },
  order:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true });
module.exports = Program;
