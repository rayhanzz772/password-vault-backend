'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('note_tags', {
      note_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'secret_notes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('note_tags');
  }
};
