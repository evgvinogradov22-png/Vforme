const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Lecture = sequelize.define('Lecture', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  moduleId: { type: DataTypes.UUID, allowNull: false },
  title:    { type: DataTypes.STRING, allowNull: false },
  duration: { type: DataTypes.STRING },
  videoUrl: { type: DataTypes.STRING },
  content:  { type: DataTypes.JSONB },
  tasks:    { type: DataTypes.JSONB },
  points:   { type: DataTypes.INTEGER, defaultValue: 10 },
  order:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true });
module.exports = Lecture;
