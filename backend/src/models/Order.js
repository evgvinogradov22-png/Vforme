const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderId:   { type: DataTypes.STRING, unique: true, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: false },
  programId: { type: DataTypes.UUID, allowNull: false },
  amount:    { type: DataTypes.INTEGER },
  promoId:   { type: DataTypes.UUID },
  type:      { type: DataTypes.STRING, defaultValue: 'program' }, // program | protocol
  status:    { type: DataTypes.ENUM('pending','paid','failed'), defaultValue: 'pending' },
}, { timestamps: true, indexes: [{ fields: ['userId'] }, { fields: ['status', 'createdAt'] }] });

module.exports = Order;
