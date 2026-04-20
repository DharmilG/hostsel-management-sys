const pool = require("../config/db")

const createRoomAllocation = async (student_id, room_id) => {
  const query = `
    INSERT INTO room_allocations (student_id, room_id, allocated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (student_id) DO UPDATE
      SET room_id = EXCLUDED.room_id,
          allocated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  const values = [student_id, room_id]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getLatestAllocationByStudent = async (student_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM room_allocations WHERE student_id = $1 ORDER BY allocated_at DESC LIMIT 1",
    [student_id]
  )
  return rows[0]
}

const deleteRoomAllocation = async (id) => {
  await pool.query("DELETE FROM room_allocations WHERE id = $1", [id])
}

module.exports = {
  createRoomAllocation,
  getLatestAllocationByStudent,
  deleteRoomAllocation
}
