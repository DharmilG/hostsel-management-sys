const express = require("express")
const router = express.Router()
const { createShift, listShifts, assignShift, unassignShift, requestSwap, exportIcs } = require("../controllers/shiftController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

// list shifts (authenticated)
router.get("/", authMiddleware, listShifts)
// export as ICS
router.get("/export", authMiddleware, exportIcs)

// create (admin/staff)
router.post("/", authMiddleware, roleMiddleware(["admin", "staff"]), createShift)

// assign/unassign (admin or self)
router.post("/:id/assign", authMiddleware, assignShift)
router.post("/:id/unassign", authMiddleware, unassignShift)

// request swap (assignment-level)
router.post("/assignments/:id/request-swap", authMiddleware, requestSwap)

module.exports = router
