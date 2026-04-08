const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserEvent = sequelize.define('UserEvent', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  event:     { type: DataTypes.STRING, allowNull: false }, // login, program_open, button_click, etc
  data:      { type: DataTypes.JSONB, defaultValue: {} },  // { programId, title, button, etc }
  sessionId: { type: DataTypes.STRING },
  duration:  { type: DataTypes.INTEGER },                  // секунды на сайте
}, { timestamps: true });

module.exports = UserEvent;
