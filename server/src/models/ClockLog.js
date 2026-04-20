const pool = require("../config/db")

const createClockLog = async ({ device_id = null, user_id = null, event_type, method = 'qr', client_event_id = null, metadata = {} }) => {
  const query = `
    INSERT INTO clock_logs (device_id, user_id, event_type, method, client_event_id, metadata)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `
  const values = [device_id, user_id, event_type, method, client_event_id, JSON.stringify(metadata || {})]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getLogsByDevice = async (device_id, limit = 200) => {
  const { rows } = await pool.query(
    "SELECT * FROM clock_logs WHERE device_id = $1 ORDER BY created_at DESC LIMIT $2",
    [device_id, limit]
  )
  return rows
}

const getLogsByUser = async (user_id, start = null, end = null) => {
  let q = "SELECT * FROM clock_logs WHERE user_id = $1"
  const vals = [user_id]
  if (start) {
    vals.push(start)
    q += ` AND created_at >= $${vals.length}`
  }
  if (end) {
    vals.push(end)
    q += ` AND created_at <= $${vals.length}`
  }
  q += " ORDER BY created_at ASC"
  const { rows } = await pool.query(q, vals)
  return rows
}

const getLogsInRange = async (start, end) => {
  const { rows } = await pool.query(
    "SELECT * FROM clock_logs WHERE created_at >= $1 AND created_at <= $2 ORDER BY user_id, created_at",
    [start, end]
  )
  return rows
}

module.exports = {
  createClockLog,
  getLogsByDevice,
  getLogsByUser,
  getLogsInRange
}
