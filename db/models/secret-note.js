'use strict'
const { Model } = require('sequelize')
const db = require("../models");
const cuid = require('cuid')

module.exports = (sequelize, DataTypes) => {
  class SecretNote extends Model {
    static associate(models) {
      SecretNote.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      SecretNote.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });
      SecretNote.belongsToMany(models.Tag, {
        through: models.NoteTag,
        foreignKey: 'note_id',
        otherKey: 'tag_id',
        as: 'tags',
      });
    }
  }

  SecretNote.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => cuid(),
      },
      user_id: { type: DataTypes.STRING, allowNull: false },
      category_id: { type: DataTypes.STRING, allowNull: true },
      title: { type: DataTypes.STRING, allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: false },
      kdf_type: {
        type: DataTypes.STRING,
        defaultValue: "argon2id",
      },
      kdf_params: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: 'SecretNote',
      tableName: 'secret_notes',
      timestamps: true,
      underscored: true
    }
  )
  return SecretNote
}
