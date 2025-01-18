const pool = require("../config/db")

const createComplaint = async (data) => {
  const query = `
    INSERT INTO complaints (
      student_id,
      title,
      description,
      category,
      status
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
  `
  const values = [
    data.student_id,
    data.title,
    data.description,
    data.category,
    data.status || "pending"
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getAllComplaints = async () => {
  const { rows } = await pool.query("SELECT * FROM complaints ORDER BY created_at DESC")
  return rows
}

const getComplaintsByStudent = async (student_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM complaints WHERE student_id = $1 ORDER BY created_at DESC",
    [student_id]
  )
  return rows
}

const updateComplaintStatus = async (id, status) => {
  const { rows } = await pool.query(
    "UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  )
  return rows[0]
}

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintsByStudent,
  updateComplaintStatus
}
