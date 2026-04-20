const pool = require("../config/db")

const createDevice = async (name, type, locationJson, apiKeyHash, created_by) => {
  const query = `
    INSERT INTO devices (name, type, location, api_key_hash, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `
  const values = [name, type || 'kiosk', locationJson ? JSON.stringify(locationJson) : '{}', apiKeyHash, created_by || null]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const getDeviceById = async (id) => {
  const { rows } = await pool.query("SELECT * FROM devices WHERE id = $1", [id])
  return rows[0]
}

const getAllDevices = async () => {
  const { rows } = await pool.query("SELECT * FROM devices ORDER BY id DESC")
  return rows
}

const updateLastSeen = async (id) => {
  const { rows } = await pool.query(
    "UPDATE devices SET last_seen = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  )
  return rows[0]
}

module.exports = {
  createDevice,
  getDeviceById,
  getAllDevices,
  updateLastSeen
}
