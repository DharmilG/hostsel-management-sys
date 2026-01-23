const pool = require("../config/db")

const markAttendance = async (student_id, attendance_date, status) => {
  const query = `
    INSERT INTO attendance (student_id, attendance_date, status)
    VALUES ($1, $2, $3)
    RETURNING *
  `
  const values = [student_id, attendance_date, status]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getAttendanceByStudent = async (student_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM attendance WHERE student_id = $1 ORDER BY attendance_date DESC",
    [student_id]
  )
  return rows
}

const getAllAttendance = async () => {
  const { rows } = await pool.query(
    "SELECT * FROM attendance ORDER BY attendance_date DESC"
  )
  return rows
}

module.exports = {
  markAttendance,
  getAttendanceByStudent,
  getAllAttendance
}
