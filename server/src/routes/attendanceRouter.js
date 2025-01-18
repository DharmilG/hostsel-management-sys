const express = require("express")
const {
  markAttendanceHandler,
  getAttendanceByStudentHandler,
  getAllAttendanceHandler
} = require("../controllers/attendanceController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, markAttendanceHandler)
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllAttendanceHandler)
router.get("/student/:studentId", authMiddleware, getAttendanceByStudentHandler)

module.exports = router
