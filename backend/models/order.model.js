'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Một Đơn hàng thuộc về một User
      Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Một Đơn hàng có nhiều Chi tiết đơn hàng (OrderItems)
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items'
      });
    }
  }
  Order.init({
    userId: DataTypes.INTEGER,
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    paymentMethod: DataTypes.STRING,
    shippingAddress: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};