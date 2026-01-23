const express = require("express")
const {
  createComplaintHandler,
  getAllComplaintsHandler,
  getComplaintsByStudentHandler,
  updateComplaintStatusHandler
} = require("../controllers/complaintController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, createComplaintHandler)
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllComplaintsHandler)
router.get("/student/:studentId", authMiddleware, getComplaintsByStudentHandler)
router.put("/:id/status", authMiddleware, roleMiddleware(["admin"]), updateComplaintStatusHandler)

module.exports = router
