const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Recipe = sequelize.define('Recipe', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  cat:         { type: DataTypes.STRING },
  time:        { type: DataTypes.STRING },
  kcal:        { type: DataTypes.INTEGER },
  protein:     { type: DataTypes.FLOAT },
  fat:         { type: DataTypes.FLOAT },
  carbs:       { type: DataTypes.FLOAT },
  ingredients: { type: DataTypes.JSONB },
  steps:       { type: DataTypes.JSONB },
  fact:        { type: DataTypes.TEXT },
  imageUrl:    { type: DataTypes.STRING },
  authorId:    { type: DataTypes.UUID },
  authorName:  { type: DataTypes.STRING },
  likes:       { type: DataTypes.INTEGER, defaultValue: 0 },
  dietTags:    { type: DataTypes.JSONB, defaultValue: [] }, // ['кето','без глютена','веган', ...]
}, { timestamps: true });
module.exports = Recipe;
