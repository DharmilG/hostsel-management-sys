const express = require("express")
const router = express.Router()
const pool = require("../config/db")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

// GET /api/users?role=staff  — list users by role (admin only)
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res, next) => {
  try {
    const { role } = req.query
    const values = []
    let where = ""
    if (role) {
      where = "WHERE role = $1"
      values.push(role)
    }
    const { rows } = await pool.query(
      `SELECT id, username, email, role FROM users ${where} ORDER BY username ASC`,
      values
    )
    res.status(200).json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
})

module.exports = router
