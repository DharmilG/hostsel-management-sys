const express = require("express")
const { register, login, resetPassword, googleAuth } = require("../controllers/authController")

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/reset-password", resetPassword)
router.post("/google", googleAuth)

module.exports = router
