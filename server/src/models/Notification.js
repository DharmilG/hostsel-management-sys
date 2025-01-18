const pool = require("../config/db")

const createNotification = async (student_id, message, type) => {
  const query = `
    INSERT INTO notifications (student_id, message, type)
    VALUES ($1, $2, $3)
    RETURNING *
  `
  const { rows } = await pool.query(query, [student_id, message, type])
  return rows[0]
}

const getNotificationsByStudent = async (student_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC",
    [student_id]
  )
  return rows
}

const markNotificationRead = async (id) => {
  const { rows } = await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *",
    [id]
  )
  return rows[0]
}

module.exports = {
  createNotification,
  getNotificationsByStudent,
  markNotificationRead
}
