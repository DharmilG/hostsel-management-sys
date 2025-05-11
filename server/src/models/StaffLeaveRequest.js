const pool = require("../config/db")

// Helper: ensure attachments is always a valid JS array before storing
const normaliseAttachments = (attachments) => {
  if (!attachments) return []
  if (Array.isArray(attachments)) return attachments
  if (typeof attachments === "string") {
    try { return JSON.parse(attachments) } catch { return [] }
  }
  return []
}

const createLeaveRequest = async (data) => {
  const query = `
    INSERT INTO staff_leave_requests (
      staff_id, leave_type, start_time, end_time, partial, partial_start_time, partial_end_time, reason, attachments, status, requested_via, requested_by_device_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING *
  `
  const attachments = normaliseAttachments(data.attachments)
  const values = [
    data.staff_id,
    data.leave_type,
    data.start_time,
    data.end_time,
    data.partial || false,
    data.partial_start_time || null,
    data.partial_end_time || null,
    data.reason || null,
    JSON.stringify(attachments),
    data.status || "pending",
    data.requested_via || null,
    data.requested_by_device_id || null
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getLeaveRequestsByStaff = async (staff_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM staff_leave_requests WHERE staff_id = $1 ORDER BY created_at DESC`,
    [staff_id]
  )
  return rows
}

const getAllLeaveRequests = async () => {
  const { rows } = await pool.query(
    `SELECT lr.*, u.username AS staff_username, u.email AS staff_email FROM staff_leave_requests lr LEFT JOIN users u ON u.id = lr.staff_id ORDER BY lr.created_at DESC`
  )
  return rows
}

const getPendingRequests = async () => {
  const { rows } = await pool.query(`SELECT lr.*, u.username AS staff_username, u.email AS staff_email FROM staff_leave_requests lr LEFT JOIN users u ON u.id = lr.staff_id WHERE lr.status = 'pending' ORDER BY lr.created_at ASC`)
  return rows
}

const updateLeaveRequestStatus = async (id, status, admin_id = null, admin_comment = null) => {
  const { rows } = await pool.query(
    `UPDATE staff_leave_requests SET status = $1, admin_id = $2, admin_comment = $3, updated_at = now() WHERE id = $4 RETURNING *`,
    [status, admin_id, admin_comment, id]
  )
  return rows[0]
}

const cancelLeaveRequest = async (id, staff_id) => {
  const { rows } = await pool.query(
    `UPDATE staff_leave_requests SET status = 'cancelled', updated_at = now() WHERE id = $1 AND staff_id = $2 RETURNING *`,
    [id, staff_id]
  )
  return rows[0]
}

module.exports = {
  createLeaveRequest,
  getLeaveRequestsByStaff,
  getAllLeaveRequests,
  getPendingRequests,
  updateLeaveRequestStatus,
  cancelLeaveRequest
}
