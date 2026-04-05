const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = sequelize.define('User', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email:    { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name:     { type: DataTypes.STRING },
  role:     { type: DataTypes.ENUM('user','admin','superadmin'), defaultValue: 'user' },
  phone:    { type: DataTypes.STRING },
  avatar:   { type: DataTypes.STRING },
}, { timestamps: true });
module.exports = User;
