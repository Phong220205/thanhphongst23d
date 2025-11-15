'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('Orders');
    
    if (!tableDescription.shippingAddress) {
      await queryInterface.addColumn('Orders', 'shippingAddress', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added shippingAddress column to Orders table');
    } else {
      console.log('shippingAddress column already exists in Orders table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'shippingAddress');
  }
};

