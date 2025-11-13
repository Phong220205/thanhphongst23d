'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Một User có nhiều Đơn hàng (Orders)
      User.hasMany(models.Order, {
        foreignKey: 'userId',
        as: 'orders'
      });
      
      // Một User có nhiều Reviews
      User.hasMany(models.Review, {
        foreignKey: 'userId',
        as: 'reviews'
      });
    }
  }
  User.init({
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
         if (user.changed('password')) {
           const salt = await bcrypt.genSalt(10);
           user.password = await bcrypt.hash(user.password, salt);
         }
      }
    }
  });

  User.prototype.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  return User;
};