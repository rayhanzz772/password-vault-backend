'use strict'
const { Model } = require('sequelize')
const cuid = require('cuid')

module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      Tag.belongsToMany(models.SecretNote, {
        through: models.NoteTag,
        foreignKey: 'tag_id',
        otherKey: 'note_id',
        as: 'secret_notes',
      });
    }
  }

  Tag.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => cuid(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Tag',
      tableName: 'tags',
      timestamps: true,
      underscored: true
    }
  )
  return Tag
}
