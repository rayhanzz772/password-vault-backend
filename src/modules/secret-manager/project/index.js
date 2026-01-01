const express = require('express')
const router = express.Router()
const validateRequest = require('../../../middleware/validateRequest')
const { createProjectSchema } = require('./schema')
const {
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject
} = require('./controller')

router.post(
  '/create',
  validateRequest({ body: createProjectSchema }),
  createProject
)
router.get('/', getAllProjects)
router.get('/:id/show', getProjectById)
router.delete('/:id/delete', deleteProject)

module.exports = router
