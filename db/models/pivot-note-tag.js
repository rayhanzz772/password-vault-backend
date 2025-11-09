'use strict'
const { Model } = require('sequelize')
const cuid = require('cuid')

module.exports = (sequelize, DataTypes) => {
  class NoteTag extends Model {}

  NoteTag.init(
    {
      note_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tag_id: {
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
      modelName: 'NoteTag',
      tableName: 'note_tags',
      timestamps: true,
      underscored: true,
    }
  )

  return NoteTag
}
