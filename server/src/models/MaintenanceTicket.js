const pool = require("../config/db")

// Helper: normalise photos/attachments before storing as JSONB
const normalisePhotos = (photos) => {
  if (!photos) return []
  if (Array.isArray(photos)) return photos
  if (typeof photos === "string") {
    try { return JSON.parse(photos) } catch { return [] }
  }
  return []
}

// ─── Create ──────────────────────────────────────────────────────────────────

const createTicket = async (data) => {
  const photos = normalisePhotos(data.photos)
  const query = `
    INSERT INTO maintenance_tickets
      (title, description, category, priority, status, location, room_id,
       raised_by_student_id, raised_by_user_id, assigned_to, photos)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
    RETURNING *
  `
  const values = [
    data.title,
    data.description || null,
    data.category || "general",
    data.priority || "medium",
    data.status || "open",
    data.location || null,
    data.room_id || null,
    data.raised_by_student_id || null,
    data.raised_by_user_id || null,
    data.assigned_to || null,
    JSON.stringify(photos)
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

// ─── Read ─────────────────────────────────────────────────────────────────────

const getAllTickets = async ({ status, priority, assigned_to } = {}) => {
  const conditions = []
  const values = []
  let idx = 1

  if (status) { conditions.push(`t.status = $${idx++}`); values.push(status) }
  if (priority) { conditions.push(`t.priority = $${idx++}`); values.push(priority) }
  if (assigned_to) { conditions.push(`t.assigned_to = $${idx++}`); values.push(assigned_to) }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const query = `
    SELECT
      t.*,
      s.full_name  AS raised_student_name,
      s.email      AS raised_student_email,
      u.username   AS raised_user_name,
      u.email      AS raised_user_email,
      a.username   AS assigned_username,
      a.email      AS assigned_email
    FROM maintenance_tickets t
    LEFT JOIN students s ON s.id = t.raised_by_student_id
    LEFT JOIN users    u ON u.id = t.raised_by_user_id
    LEFT JOIN users    a ON a.id = t.assigned_to
    ${where}
    ORDER BY
      CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      t.created_at DESC
  `
  const { rows } = await pool.query(query, values)
  return rows
}

const getTicketsByStudent = async (raised_by_student_id) => {
  const query = `
    SELECT t.*, a.username AS assigned_username
    FROM maintenance_tickets t
    LEFT JOIN users a ON a.id = t.assigned_to
    WHERE t.raised_by_student_id = $1
    ORDER BY t.created_at DESC
  `
  const { rows } = await pool.query(query, [raised_by_student_id])
  return rows
}

const getTicketsByUser = async (raised_by_user_id) => {
  const query = `
    SELECT t.*, a.username AS assigned_username
    FROM maintenance_tickets t
    LEFT JOIN users a ON a.id = t.assigned_to
    WHERE t.raised_by_user_id = $1
    ORDER BY t.created_at DESC
  `
  const { rows } = await pool.query(query, [raised_by_user_id])
  return rows
}

const getTicketById = async (id) => {
  const query = `
    SELECT
      t.*,
      s.full_name  AS raised_student_name,
      s.email      AS raised_student_email,
      u.username   AS raised_user_name,
      u.email      AS raised_user_email,
      a.username   AS assigned_username,
      a.email      AS assigned_email
    FROM maintenance_tickets t
    LEFT JOIN students s ON s.id = t.raised_by_student_id
    LEFT JOIN users    u ON u.id = t.raised_by_user_id
    LEFT JOIN users    a ON a.id = t.assigned_to
    WHERE t.id = $1
  `
  const { rows } = await pool.query(query, [id])
  return rows[0] || null
}

const getAssignedTickets = async (userId) => {
  const query = `
    SELECT t.*, u.username AS raised_user_name, s.full_name AS raised_student_name
    FROM maintenance_tickets t
    LEFT JOIN users    u ON u.id = t.raised_by_user_id
    LEFT JOIN students s ON s.id = t.raised_by_student_id
    WHERE t.assigned_to = $1
    ORDER BY
      CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      t.created_at DESC
  `
  const { rows } = await pool.query(query, [userId])
  return rows
}

// ─── Update ───────────────────────────────────────────────────────────────────

const updateTicket = async (id, data) => {
  const fields = []
  const values = []
  let idx = 1

  const allowed = ["title", "description", "category", "priority", "status",
                   "location", "room_id", "assigned_to", "resolution_notes"]

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`)
      values.push(data[key])
    }
  }

  if (data.photos !== undefined) {
    fields.push(`photos = $${idx++}::jsonb`)
    values.push(JSON.stringify(normalisePhotos(data.photos)))
  }

  if (fields.length === 0) return getTicketById(id)

  values.push(id)
  const query = `UPDATE maintenance_tickets SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`
  const { rows } = await pool.query(query, values)
  return rows[0] || null
}

const deleteTicket = async (id) => {
  const { rows } = await pool.query(
    "DELETE FROM maintenance_tickets WHERE id = $1 RETURNING *",
    [id]
  )
  return rows[0] || null
}

module.exports = {
  createTicket,
  getAllTickets,
  getTicketsByStudent,
  getTicketsByUser,
  getTicketById,
  getAssignedTickets,
  updateTicket,
  deleteTicket
}
