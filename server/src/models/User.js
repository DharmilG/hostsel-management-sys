const pool = require("../config/db")

const createUser = async (username, email, passwordHash, role) => {
  const query = `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, role
  `
  const values = [username, email, passwordHash, role]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`
  const { rows } = await pool.query(query, [email])
  return rows[0]
}

const findUserById = async (id) => {
  const query = `SELECT id, username, email, role, last_login_at, last_login_method FROM users WHERE id = $1`
  const { rows } = await pool.query(query, [id])
  return rows[0]
}

const updateUserPassword = async (email, passwordHash) => {
  const query = `
    UPDATE users SET password_hash = $1 WHERE email = $2
  `
  const values = [passwordHash, email]
  await pool.query(query, values)
}

const updateLastLogin = async (userId, method) => {
  const query = `
    UPDATE users
    SET last_login_at = NOW(), last_login_method = $1
    WHERE id = $2
    RETURNING id, username, email, role, last_login_at, last_login_method
  `
  const values = [method, userId]
  const { rows } = await pool.query(query, values)
  return rows[0]
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword
  , updateLastLogin
}
