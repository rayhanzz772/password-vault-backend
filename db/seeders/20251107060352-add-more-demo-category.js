'use strict';
const cuid = require('cuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.bulkInsert('categories', [
      {
        id: cuid(),
        name: 'Personal',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: cuid(),
        name: 'Medical',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: cuid(),
        name: 'Ideas',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: cuid(),
        name: 'Other',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
