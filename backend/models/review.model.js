'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      // Một Review thuộc về một User
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Một Review thuộc về một Product
      Review.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }
  Review.init({
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    productId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'Products', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    rating: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    comment: { type: DataTypes.TEXT },
  }, {
    sequelize,
    modelName: 'Review',
    indexes: [
      { unique: true, fields: ['userId', 'productId'] } // Một user chỉ review một sản phẩm một lần
    ]
  });
  return Review;
};

