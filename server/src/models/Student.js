const pool = require("../config/db")

const createStudent = async (data) => {
  const query = `
    INSERT INTO students (
      user_id,
      roll_no,
      full_name,
      course,
      year,
      contact_number,
      email,
      emergency_contact,
      address
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `
  const values = [
    data.user_id,
    data.roll_no,
    data.full_name,
    data.course,
    data.year,
    data.contact_number,
    data.email,
    data.emergency_contact,
    data.address
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getAllStudents = async () => {
  const { rows } = await pool.query("SELECT * FROM students ORDER BY id DESC")
  return rows
}

const getAllStudentsWithRooms = async () => {
  const query = `
    SELECT s.*, latest.room_id AS room_id, latest.allocation_id AS allocation_id, latest.allocated_at AS allocated_at, r.room_number, r.block
    FROM students s
    LEFT JOIN LATERAL (
      SELECT ra.id AS allocation_id, ra.room_id, ra.allocated_at
      FROM room_allocations ra
      WHERE ra.student_id = s.id
      ORDER BY ra.allocated_at DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN rooms r ON r.id = latest.room_id
    ORDER BY s.id DESC
  `
  const { rows } = await pool.query(query)
  return rows
}

const getStudentById = async (id) => {
  const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [id])
  return rows[0]
}

const getStudentByUserId = async (user_id) => {
  const { rows } = await pool.query("SELECT * FROM students WHERE user_id = $1", [user_id])
  return rows[0]
}

const updateStudent = async (id, data) => {
  const query = `
    UPDATE students
    SET
      full_name = $1,
      course = $2,
      year = $3,
      contact_number = $4,
      email = $5,
      emergency_contact = $6,
      address = $7
    WHERE id = $8
    RETURNING *
  `
  const values = [
    data.full_name,
    data.course,
    data.year,
    data.contact_number,
    data.email,
    data.emergency_contact,
    data.address,
    id
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const deleteStudent = async (id) => {
  await pool.query("DELETE FROM students WHERE id = $1", [id])
}

module.exports = {
  createStudent,
  getAllStudents,
  getAllStudentsWithRooms,
  getStudentById,
  updateStudent,
  getStudentByUserId,
  deleteStudent
}
