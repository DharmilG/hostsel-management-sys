const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const {
  createTicketHandler,
  getAllTicketsHandler,
  getMyTicketsHandler,
  getAssignedTicketsHandler,
  getTicketByIdHandler,
  updateTicketHandler,
  updateMyTicketStatusHandler,
  deleteTicketHandler
} = require("../controllers/maintenanceController")

// Create a ticket (any authenticated user — student, staff, admin)
router.post("/", authMiddleware, createTicketHandler)

// Get my own created tickets (student sees their own, staff/admin see their own)
router.get("/me", authMiddleware, getMyTicketsHandler)

// Get tickets assigned to me (staff)
router.get("/assigned", authMiddleware, getAssignedTicketsHandler)

// Get all tickets (admin only) — supports ?status= ?priority= ?assigned_to= filters
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllTicketsHandler)

// Get single ticket by id (admin, or owner)
router.get("/:id", authMiddleware, getTicketByIdHandler)

// Full update (admin only) — status, assign, priority, etc.
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateTicketHandler)

// Staff updates own assigned ticket status (in_progress / resolved)
router.patch("/:id/status", authMiddleware, updateMyTicketStatusHandler)

// Delete ticket (admin only)
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteTicketHandler)

module.exports = router
