const pool = require("../config/db")

const createRoom = async (data) => {
  const query = `
    INSERT INTO rooms (
      room_number,
      block,
      floor,
      capacity,
      occupied_count,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `
  const values = [
    data.room_number,
    data.block,
    data.floor,
    data.capacity,
    data.occupied_count || 0,
    data.status || "available"
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getAllRooms = async () => {
  const { rows } = await pool.query("SELECT * FROM rooms ORDER BY id DESC")
  return rows
}

const getRoomById = async (id) => {
  const { rows } = await pool.query("SELECT * FROM rooms WHERE id = $1", [id])
  return rows[0]
}

const updateRoom = async (id, data) => {
  const query = `
    UPDATE rooms
    SET
      room_number = $1,
      block = $2,
      floor = $3,
      capacity = $4,
      occupied_count = $5,
      status = $6
    WHERE id = $7
    RETURNING *
  `
  const values = [
    data.room_number,
    data.block,
    data.floor,
    data.capacity,
    data.occupied_count,
    data.status,
    id
  ]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const deleteRoom = async (id) => {
  await pool.query("DELETE FROM rooms WHERE id = $1", [id])
}

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom
}
