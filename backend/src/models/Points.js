const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Points = sequelize.define('Points', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  amount:    { type: DataTypes.INTEGER, allowNull: false },
  reason:    { type: DataTypes.STRING }, // 'lecture_complete', 'module_complete', 'program_complete'
  refId:     { type: DataTypes.UUID },   // lectureId / moduleId / programId
  refType:   { type: DataTypes.STRING }, // 'lecture' | 'module' | 'program'
}, { timestamps: true });

module.exports = Points;
