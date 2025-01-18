const bcrypt = require("bcryptjs")
const { generateToken } = require("../config/jwt")
const { createUser, findUserByEmail } = require("../models/User")

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body || {}

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing fields" })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser(username, email, passwordHash, role)

    res.status(201).json({ success: true, data: user })
  } catch (error) {
    if (error.code === "23505" && error.constraint === "users_username_key") {
      return res.status(409).json({ success: false, message: "Username already exists" })
    }
    if (error.code === "23514" && error.constraint === "users_role_check") {
      return res.status(400).json({ success: false, message: "Invalid role provided" })
    }
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    console.log("Login attempt for:", email)

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" })
    }

    const user = await findUserByEmail(email)
    console.log("User found in DB:", user ? "Yes" : "No")

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    console.log("Password match:", isMatch)

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const token = generateToken({ id: user.id, role: user.role })

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login }
