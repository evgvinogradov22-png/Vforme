const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const DeployHistory = sequelize.define('DeployHistory', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  env:       { type: DataTypes.STRING(16), allowNull: false },     // 'test' | 'prod'
  action:    { type: DataTypes.STRING(32), defaultValue: 'deploy' }, // deploy | promote | rollback
  desc:      { type: DataTypes.TEXT },
  status:    { type: DataTypes.STRING(16), defaultValue: 'ok' },   // 'ok' | 'error'
  output:    { type: DataTypes.TEXT },
  errorMsg:  { type: DataTypes.TEXT },
  userId:    { type: DataTypes.UUID },
  userName:  { type: DataTypes.STRING },
  userEmail: { type: DataTypes.STRING },
}, {
  timestamps: true,
  indexes: [{ fields: ['createdAt'] }],
});

module.exports = DeployHistory;
