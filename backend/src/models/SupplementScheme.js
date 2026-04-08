const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const SupplementScheme = sequelize.define('SupplementScheme', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  programId: { type: DataTypes.UUID },
  title:     { type: DataTypes.STRING, allowNull: false },
  desc:      { type: DataTypes.TEXT },
  price:     { type: DataTypes.INTEGER, defaultValue: 0 },
  available: { type: DataTypes.BOOLEAN, defaultValue: true },
  tags:      { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true });
module.exports = SupplementScheme;
