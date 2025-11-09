const db = require("../../../db/models");
const Tag = db.Tag;
const SecretNote = db.SecretNote;
const { HttpStatusCode } = require('axios');

const HTTP_OK = HttpStatusCode?.Ok || 200;
const CREATED = HttpStatusCode?.Created || 201;
const BAD_REQUEST = HttpStatusCode?.BadRequest || 400;
const NOT_FOUND = HttpStatusCode?.NotFound || 404;
const INTERNAL_SERVER_ERROR = HttpStatusCode?.InternalServerError || 500;

class TagController {
  /**
   * Get all tags
   * GET /api/tags
   */
  static async getAllTags(req, res) {
    try {
      const { search = '', limit = 50, offset = 0 } = req.query;

      let whereConditions = {};
      
      // Add search condition
      if (search && search.trim()) {
        whereConditions.name = {
          [db.Sequelize.Op.iLike]: `%${search.trim()}%`
        };
      }

      // Get total count
      const total = await Tag.count({ where: whereConditions });

      // Get tags with pagination
      const tags = await Tag.findAll({
        where: whereConditions,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['created_at', 'DESC']],
        include: [{
          model: SecretNote,
          as: 'secret_notes',
          attributes: ['id'],
          required: false
        }]
      });

      // Format response with note count
      const formattedTags = tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        noteCount: tag.secret_notes ? tag.secret_notes.length : 0,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at
      }));

      return res.json({
        success: true,
        data: formattedTags,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
          hasMore: parseInt(offset, 10) + parseInt(limit, 10) < total
        }
      });
    } catch (err) {
      console.error("Get tags error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to fetch tags"
      });
    }
  }

  /**
   * Get single tag by ID
   * GET /api/tags/:id
   */
  static async getTagById(req, res) {
    try {
      const { id } = req.params;

      const tag = await Tag.findByPk(id, {
        include: [{
          model: SecretNote,
          as: 'secret_notes',
          attributes: ['id', 'title', 'created_at']
        }]
      });

      if (!tag) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: "Tag not found"
        });
      }

      return res.json({
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          noteCount: tag.secret_notes ? tag.secret_notes.length : 0,
          notes: tag.secret_notes,
          createdAt: tag.created_at,
          updatedAt: tag.updated_at
        }
      });
    } catch (err) {
      console.error("Get tag error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to fetch tag"
      });
    }
  }

  /**
   * Create a single tag
   * POST /api/tags
   * Body: { name: "tag-name" }
   */
  static async createTag(req, res) {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Tag name is required"
        });
      }

      // Check if tag already exists
      const existingTag = await Tag.findOne({
        where: { name: name.trim() }
      });

      if (existingTag) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Tag already exists",
          data: existingTag
        });
      }

      const tag = await Tag.create({
        name: name.trim()
      });

      return res.status(CREATED).json({
        success: true,
        message: "Tag created successfully",
        data: {
          id: tag.id,
          name: tag.name,
          createdAt: tag.created_at
        }
      });
    } catch (err) {
      console.error("Create tag error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to create tag"
      });
    }
  }

  /**
   * Bulk create tags
   * POST /api/tags/bulk
   * Body: { tags: ["tag1", "tag2", "tag3"] }
   */
  static async bulkCreateTags(req, res) {
    const t = await db.sequelize.transaction();
    try {
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Tags array is required and must not be empty"
        });
      }

      // Validate all tag names
      const validTags = tags
        .filter(tag => tag && typeof tag === 'string' && tag.trim())
        .map(tag => tag.trim());

      if (validTags.length === 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "No valid tag names provided"
        });
      }

      // Check for existing tags
      const existingTags = await Tag.findAll({
        where: {
          name: {
            [db.Sequelize.Op.in]: validTags
          }
        },
        transaction: t
      });

      const existingTagNames = existingTags.map(tag => tag.name);
      const newTagNames = validTags.filter(name => !existingTagNames.includes(name));

      // Create new tags
      const createdTags = [];
      if (newTagNames.length > 0) {
        const tagsToCreate = newTagNames.map(name => ({ name }));
        const created = await Tag.bulkCreate(tagsToCreate, { 
          transaction: t,
          returning: true 
        });
        createdTags.push(...created);
      }

      await t.commit();

      return res.status(CREATED).json({
        success: true,
        message: `${createdTags.length} tags created successfully`,
        data: {
          created: createdTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.created_at
          })),
          skipped: existingTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            reason: "already exists"
          })),
          summary: {
            total: validTags.length,
            created: createdTags.length,
            skipped: existingTags.length
          }
        }
      });
    } catch (err) {
      await t.rollback();
      console.error("Bulk create tags error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to create tags"
      });
    }
  }

  /**
   * Update a tag
   * PUT /api/tags/:id
   * Body: { name: "new-name" }
   */
  static async updateTag(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Tag name is required"
        });
      }

      const tag = await Tag.findByPk(id);

      if (!tag) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: "Tag not found"
        });
      }

      // Check if new name already exists
      const existingTag = await Tag.findOne({
        where: { 
          name: name.trim(),
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingTag) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Tag name already exists"
        });
      }

      tag.name = name.trim();
      await tag.save();

      return res.json({
        success: true,
        message: "Tag updated successfully",
        data: {
          id: tag.id,
          name: tag.name,
          updatedAt: tag.updated_at
        }
      });
    } catch (err) {
      console.error("Update tag error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to update tag"
      });
    }
  }

  /**
   * Bulk update tags
   * PUT /api/tags/bulk
   * Body: { tags: [{ id: "id1", name: "newName1" }, { id: "id2", name: "newName2" }] }
   */
  static async bulkUpdateTags(req, res) {
    const t = await db.sequelize.transaction();
    try {
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Tags array is required and must not be empty"
        });
      }

      // Validate all tags have id and name
      const validTags = tags.filter(tag => 
        tag && tag.id && tag.name && tag.name.trim()
      );

      if (validTags.length === 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "No valid tags provided (each must have id and name)"
        });
      }

      const updated = [];
      const failed = [];

      for (const tagData of validTags) {
        try {
          const tag = await Tag.findByPk(tagData.id, { transaction: t });
          
          if (!tag) {
            failed.push({
              id: tagData.id,
              name: tagData.name,
              reason: "Tag not found"
            });
            continue;
          }

          // Check if new name conflicts with another tag
          const conflictTag = await Tag.findOne({
            where: {
              name: tagData.name.trim(),
              id: { [db.Sequelize.Op.ne]: tagData.id }
            },
            transaction: t
          });

          if (conflictTag) {
            failed.push({
              id: tagData.id,
              name: tagData.name,
              reason: "Name already exists"
            });
            continue;
          }

          tag.name = tagData.name.trim();
          await tag.save({ transaction: t });

          updated.push({
            id: tag.id,
            name: tag.name,
            updatedAt: tag.updated_at
          });
        } catch (err) {
          failed.push({
            id: tagData.id,
            name: tagData.name,
            reason: err.message
          });
        }
      }

      await t.commit();

      return res.json({
        success: true,
        message: `${updated.length} tags updated successfully`,
        data: {
          updated,
          failed,
          summary: {
            total: validTags.length,
            updated: updated.length,
            failed: failed.length
          }
        }
      });
    } catch (err) {
      await t.rollback();
      console.error("Bulk update tags error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to update tags"
      });
    }
  }

  /**
   * Delete a tag
   * DELETE /api/tags/:id
   */
  static async deleteTag(req, res) {
    const t = await db.sequelize.transaction();
    try {
      const { id } = req.params;

      const tag = await Tag.findByPk(id, { transaction: t });

      if (!tag) {
        await t.rollback();
        return res.status(NOT_FOUND).json({
          success: false,
          message: "Tag not found"
        });
      }

      // Check if tag is being used
      const noteCount = await SecretNote.count({
        where: { tag_id: id },
        transaction: t
      });

      // Set tag_id to null for all notes using this tag
      if (noteCount > 0) {
        await SecretNote.update(
          { tag_id: null },
          { where: { tag_id: id }, transaction: t }
        );
      }

      await tag.destroy({ transaction: t });
      await t.commit();

      return res.json({
        success: true,
        message: "Tag deleted successfully",
        data: {
          id: tag.id,
          name: tag.name,
          notesAffected: noteCount
        }
      });
    } catch (err) {
      await t.rollback();
      console.error("Delete tag error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to delete tag"
      });
    }
  }

  /**
   * Bulk delete tags
   * DELETE /api/tags/bulk
   * Body: { ids: ["id1", "id2", "id3"] }
   */
  static async bulkDeleteTags(req, res) {
    const t = await db.sequelize.transaction();
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "IDs array is required and must not be empty"
        });
      }

      // Find all tags to delete
      const tags = await Tag.findAll({
        where: { id: { [db.Sequelize.Op.in]: ids } },
        transaction: t
      });

      if (tags.length === 0) {
        await t.rollback();
        return res.status(NOT_FOUND).json({
          success: false,
          message: "No tags found with provided IDs"
        });
      }

      const tagIds = tags.map(tag => tag.id);

      // Count affected notes
      const noteCount = await SecretNote.count({
        where: { tag_id: { [db.Sequelize.Op.in]: tagIds } },
        transaction: t
      });

      // Set tag_id to null for all affected notes
      if (noteCount > 0) {
        await SecretNote.update(
          { tag_id: null },
          { 
            where: { tag_id: { [db.Sequelize.Op.in]: tagIds } }, 
            transaction: t 
          }
        );
      }

      // Delete all tags
      const deletedCount = await Tag.destroy({
        where: { id: { [db.Sequelize.Op.in]: tagIds } },
        transaction: t
      });

      await t.commit();

      return res.json({
        success: true,
        message: `${deletedCount} tags deleted successfully`,
        data: {
          deleted: tags.map(tag => ({
            id: tag.id,
            name: tag.name
          })),
          notesAffected: noteCount,
          summary: {
            requested: ids.length,
            deleted: deletedCount,
            notFound: ids.length - deletedCount
          }
        }
      });
    } catch (err) {
      await t.rollback();
      console.error("Bulk delete tags error:", err);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to delete tags"
      });
    }
  }
}

module.exports = TagController;
