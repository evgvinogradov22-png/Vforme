const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Task = sequelize.define('Task', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  text:      { type: DataTypes.STRING, allowNull: false },
  source:    { type: DataTypes.STRING },
  lectureId: { type: DataTypes.UUID },
  done:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });
module.exports = Task;
