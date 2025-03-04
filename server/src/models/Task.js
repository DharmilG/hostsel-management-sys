const pool = require('../config/db')

const createTask = async ({ title, description, recurrence = {}, assigned_to = null, assigned_device = null, requested_by = null, due_at = null, metadata = {} }) => {
  const query = `
    INSERT INTO tasks (title, description, recurrence, assigned_to, assigned_device, requested_by, due_at, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `
  const values = [title, description, JSON.stringify(recurrence || {}), assigned_to, assigned_device, requested_by, due_at, JSON.stringify(metadata || {})]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getTaskById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id])
  return rows[0]
}

const listTasks = async ({ status = null, assigned_to = null, requested_by = null, limit = 100 } = {}) => {
  let q = 'SELECT * FROM tasks'
  const vals = []
  const conds = []
  if (status) {
    vals.push(status)
    conds.push(`status = $${vals.length}`)
  }
  if (assigned_to) {
    vals.push(assigned_to)
    conds.push(`assigned_to = $${vals.length}`)
  }
  if (requested_by) {
    vals.push(requested_by)
    conds.push(`requested_by = $${vals.length}`)
  }
  if (conds.length) q += ' WHERE ' + conds.join(' AND ')
  q += ' ORDER BY created_at DESC LIMIT $' + (vals.length + 1)
  vals.push(limit)
  const { rows } = await pool.query(q, vals)
  return rows
}

const updateTaskStatus = async (id, status, approved_by = null) => {
  const q = 'UPDATE tasks SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *'
  const { rows } = await pool.query(q, [status, approved_by, id])
  return rows[0]
}

const setTaskStatus = async (id, status, actor_id = null) => {
  if (actor_id && (status === 'approved' || status === 'rejected')) {
    const q = 'UPDATE tasks SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *'
    const { rows } = await pool.query(q, [status, actor_id, id])
    return rows[0]
  }
  const q = 'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *'
  const { rows } = await pool.query(q, [status, id])
  return rows[0]
}

const addTaskComment = async (task_id, author_id, message) => {
  const q = 'INSERT INTO task_comments (task_id, author_id, message) VALUES ($1,$2,$3) RETURNING *'
  const { rows } = await pool.query(q, [task_id, author_id, message])
  return rows[0]
}

const addTaskAttachment = async (task_id, uploaded_by, file_path, file_meta = {}) => {
  const q = 'INSERT INTO task_attachments (task_id, uploaded_by, file_path, file_meta) VALUES ($1,$2,$3,$4) RETURNING *'
  const { rows } = await pool.query(q, [task_id, uploaded_by, file_path, JSON.stringify(file_meta || {})])
  return rows[0]
}

module.exports = {
  createTask,
  getTaskById,
  listTasks,
  updateTaskStatus,
  setTaskStatus,
  addTaskComment,
  addTaskAttachment
}
