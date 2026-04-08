const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Supplement = sequelize.define('Supplement', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  schemeId: { type: DataTypes.UUID, allowNull: false },
  name:     { type: DataTypes.STRING, allowNull: false },
  dose:     { type: DataTypes.STRING },
  time:     { type: DataTypes.STRING },
  note:     { type: DataTypes.TEXT },
  buyUrl:   { type: DataTypes.STRING },
  brand:    { type: DataTypes.STRING },
  image:    { type: DataTypes.STRING },
  order:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true });
module.exports = Supplement;
