const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Comment = sequelize.define('Comment', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  recipeId: { type: DataTypes.UUID, allowNull: false },
  userId:   { type: DataTypes.UUID },
  userName: { type: DataTypes.STRING },
  text:     { type: DataTypes.TEXT, allowNull: false },
}, { timestamps: true });
module.exports = Comment;
