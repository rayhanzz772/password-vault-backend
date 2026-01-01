const cuid = require('cuid')
const slugify = require('slugify')
const api = require('../../../utils/api')
const { HttpStatusCode } = require('axios')
const HTTP_OK = HttpStatusCode?.Ok || 200

async function createProject(req, res) {
  const { Project } = req.models
  const ownerId = req.user.userId
  const { name } = req.body

  const slug = slugify(name, {
    lower: true,
    strict: true
  })

  const exists = await Project.findOne({
    where: { slug }
  })

  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'Projects with the same name already exists'
    })
  }

  await Project.create({
    id: cuid(),
    name,
    slug,
    owner_id: ownerId,
    status: 'active'
  })

  return res.status(HTTP_OK).json(api.results(null, HTTP_OK, { req }))
}

async function getAllProjects(req, res) {
  const { Project } = req.models
  const ownerId = req.user.userId

  const projects = await Project.findAll({
    where: { owner_id: ownerId }
  })

  return res.status(HTTP_OK).json(api.results(projects, HTTP_OK, { req }))
}

async function getProjectById(req, res) {
  const { Project } = req.models
  const ownerId = req.user.userId
  const { id } = req.params

  const project = await Project.findOne({
    where: { id, owner_id: ownerId }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  return res.status(HTTP_OK).json(api.results(project, HTTP_OK, { req }))
}

async function deleteProject(req, res) {
  const { Project } = req.models
  const ownerId = req.user.userId
  const { id } = req.params

  const project = await Project.findOne({
    where: { id, owner_id: ownerId }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  await project.destroy()

  return res.status(HTTP_OK).json(api.results(null, HTTP_OK, { req }))
}

module.exports = {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById
}
