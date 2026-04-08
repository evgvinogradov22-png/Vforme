const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Protocol = sequelize.define('Protocol', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  content:     { type: DataTypes.JSONB, defaultValue: {} }, // { html, images: [] }
  supplements: { type: DataTypes.JSONB, defaultValue: [] }, // [{ supplementId, link, promo, note }]
  price:       { type: DataTypes.INTEGER, defaultValue: 0 },
  available:   { type: DataTypes.BOOLEAN, defaultValue: true },
  order:       { type: DataTypes.INTEGER, defaultValue: 0 },
  tags:        { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true });

module.exports = Protocol;
