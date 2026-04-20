const pool = require("../config/db")

const createShift = async (title, description, start_time, end_time, role, area, room_id = null, created_by) => {
  const query = `
    INSERT INTO shifts (title, description, start_time, end_time, role, area, room_id, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `
  const values = [title, description, start_time, end_time, role, area, room_id, created_by]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getShiftsInRange = async (startIso, endIso) => {
  const query = `
    SELECT s.*, sa.id AS assignment_id, sa.user_id AS assigned_user_id, sa.status AS assignment_status,
           sa.requested_swap_by, u.username AS assigned_username, u.email AS assigned_email
    FROM shifts s
    LEFT JOIN shift_assignments sa ON sa.shift_id = s.id
    LEFT JOIN users u ON u.id = sa.user_id
    WHERE s.start_time < $2 AND s.end_time > $1
    ORDER BY s.start_time ASC
  `
  const values = [startIso, endIso]
  const { rows } = await pool.query(query, values)
  return rows
}

const getShiftById = async (id) => {
  const query = `SELECT * FROM shifts WHERE id = $1`
  const { rows } = await pool.query(query, [id])
  return rows[0]
}

const getAssignmentByShiftId = async (shiftId) => {
  const query = `SELECT * FROM shift_assignments WHERE shift_id = $1 LIMIT 1`
  const { rows } = await pool.query(query, [shiftId])
  return rows[0]
}

const assignShift = async (shiftId, userId) => {
  const existing = await getAssignmentByShiftId(shiftId)
  if (existing) {
    const q = `UPDATE shift_assignments SET user_id = $1, status = 'assigned', requested_swap_by = NULL, updated_at = NOW() WHERE shift_id = $2 RETURNING *`
    const { rows } = await pool.query(q, [userId, shiftId])
    return rows[0]
  }
  const q = `INSERT INTO shift_assignments (shift_id, user_id, status, created_at, updated_at) VALUES ($1, $2, 'assigned', NOW(), NOW()) RETURNING *`
  const { rows } = await pool.query(q, [shiftId, userId])
  return rows[0]
}

const unassignShift = async (shiftId) => {
  const q = `DELETE FROM shift_assignments WHERE shift_id = $1 RETURNING *`
  const { rows } = await pool.query(q, [shiftId])
  return rows[0]
}

const requestSwap = async (assignmentId, requestedById) => {
  const q = `UPDATE shift_assignments SET status = 'swap_requested', requested_swap_by = $1, updated_at = NOW() WHERE id = $2 RETURNING *`
  const { rows } = await pool.query(q, [requestedById, assignmentId])
  return rows[0]
}

module.exports = {
  createShift,
  getShiftsInRange,
  getShiftById,
  getAssignmentByShiftId,
  assignShift,
  unassignShift,
  requestSwap
}
