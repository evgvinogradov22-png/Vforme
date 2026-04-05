const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const SupplementScheme = sequelize.define('SupplementScheme', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  programId: { type: DataTypes.UUID },
  title:     { type: DataTypes.STRING, allowNull: false },
  desc:      { type: DataTypes.TEXT },
}, { timestamps: true });
module.exports = SupplementScheme;
