const pool = require('../config/db')
const { createTask, getTaskById, listTasks, setTaskStatus, addTaskComment, addTaskAttachment } = require('../models/Task')

const createTaskHandler = async (req, res, next) => {
  try {
    const body = req.body || {}
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    if (!body.title) return res.status(400).json({ success: false, message: 'Missing title' })

    const task = await createTask({
      title: body.title,
      description: body.description,
      recurrence: body.recurrence,
      assigned_to: body.assigned_to || null,
      assigned_device: body.assigned_device || null,
      requested_by: userId,
      due_at: body.due_at || null,
      metadata: body.metadata || {}
    })
    res.status(201).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

const listTasksHandler = async (req, res, next) => {
  try {
    const user = req.user
    const limit = Number(req.query.limit) || 200
    if (user && user.role === 'admin') {
      const filters = {
        status: req.query.status || null,
        assigned_to: req.query.assigned_to ? Number(req.query.assigned_to) : null,
        requested_by: req.query.requested_by ? Number(req.query.requested_by) : null,
        limit
      }
      const tasks = await listTasks(filters)
      return res.status(200).json({ success: true, data: tasks })
    }

    // Non-admin: tasks requested by or assigned to this user
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE requested_by = $1 OR assigned_to = $1 ORDER BY created_at DESC LIMIT $2',
      [user.id, limit]
    )
    res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

const getTaskHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' })
    const task = await getTaskById(id)
    if (!task) return res.status(404).json({ success: false, message: 'Not found' })

    // Authorization: admin or requester or assignee
    const user = req.user
    if (user && user.role === 'admin') return res.status(200).json({ success: true, data: task })
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    if (task.requested_by !== user.id && task.assigned_to !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' })

    res.status(200).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

const approveTaskHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' })
    const user = req.user
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const updated = await setTaskStatus(id, 'approved', user.id)
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const rejectTaskHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' })
    const user = req.user
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const updated = await setTaskStatus(id, 'rejected', user.id)
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const completeTaskHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' })
    const user = req.user
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    // allow requester or assigned to mark complete
    const task = await getTaskById(id)
    if (!task) return res.status(404).json({ success: false, message: 'Not found' })
    if (task.requested_by !== user.id && task.assigned_to !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    const updated = await setTaskStatus(id, 'completed', null)
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const addCommentHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const user = req.user
    const { message } = req.body || {}
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    if (!message) return res.status(400).json({ success: false, message: 'Missing message' })
    const comment = await addTaskComment(id, user.id, message)
    res.status(201).json({ success: true, data: comment })
  } catch (error) {
    next(error)
  }
}

const addAttachmentHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const user = req.user
    const { file_path, file_meta } = req.body || {}
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    if (!file_path) return res.status(400).json({ success: false, message: 'Missing file_path' })
    const att = await addTaskAttachment(id, user.id, file_path, file_meta || {})
    res.status(201).json({ success: true, data: att })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createTaskHandler,
  listTasksHandler,
  getTaskHandler,
  approveTaskHandler,
  rejectTaskHandler,
  completeTaskHandler,
  addCommentHandler,
  addAttachmentHandler
}
