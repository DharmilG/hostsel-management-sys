const express = require("express")
const {
  createFeeHandler,
  getFeesByStudentHandler,
  getAllFeesHandler,
  updateFeeStatusHandler
} = require("../controllers/feeController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, roleMiddleware(["admin"]), createFeeHandler)
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllFeesHandler)
router.get("/student/:studentId", authMiddleware, getFeesByStudentHandler)
router.put("/:id/status", authMiddleware, roleMiddleware(["admin"]), updateFeeStatusHandler)

module.exports = router
