const express = require("express")
const {
  getNotificationsByStudentHandler,
  markNotificationReadHandler
} = require("../controllers/notificationController")
const authMiddleware = require("../middlewares/authMiddleware")

const router = express.Router()

router.get("/student/:studentId", authMiddleware, getNotificationsByStudentHandler)
router.put("/:id/read", authMiddleware, markNotificationReadHandler)

module.exports = router
