const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const {
  createLeaveRequestHandler,
  getMyLeaveRequestsHandler,
  getAllLeaveRequestsHandler,
  getPendingRequestsHandler,
  approveRequestHandler,
  denyRequestHandler,
  cancelRequestHandler
} = require("../controllers/staffLeaveController")

// Create a leave request (staff or admin creating on behalf)
router.post("/", authMiddleware, createLeaveRequestHandler)

// Get own requests
router.get("/me", authMiddleware, getMyLeaveRequestsHandler)

// Admin endpoints
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllLeaveRequestsHandler)
router.get("/pending", authMiddleware, roleMiddleware(["admin"]), getPendingRequestsHandler)
router.put("/:id/approve", authMiddleware, roleMiddleware(["admin"]), approveRequestHandler)
router.put("/:id/deny", authMiddleware, roleMiddleware(["admin"]), denyRequestHandler)

// Cancel (staff only, owner enforced in controller)
router.put("/:id/cancel", authMiddleware, cancelRequestHandler)

module.exports = router
