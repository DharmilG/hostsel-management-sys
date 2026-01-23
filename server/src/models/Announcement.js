const pool = require("../config/db")

const createAnnouncement = async (data) => {
  const query = `
    INSERT INTO announcements (title, message, created_by)
    VALUES ($1, $2, $3)
    RETURNING *
  `
  const values = [data.title, data.message, data.created_by]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getAllAnnouncements = async () => {
  const { rows } = await pool.query(
    "SELECT * FROM announcements ORDER BY created_at DESC"
  )
  return rows
}

module.exports = {
  createAnnouncement,
  getAllAnnouncements
}
