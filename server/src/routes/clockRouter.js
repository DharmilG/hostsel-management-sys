const express = require('express')
const { createClock, createClockBatch, getTimesheet, exportPayroll } = require('../controllers/clockController')
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')

const router = express.Router()

// Single clock event: supports JWT-authenticated user or device-auth flow (headers)
router.post('/', createClock)

// Batch sync from devices (idempotent via client_event_id)
router.post('/batch', createClockBatch)

// Timesheet view (authenticated). Admins can request any user; others only themselves.
router.get('/timesheets', authMiddleware, getTimesheet)

// Payroll export (admin)
router.get('/payroll/export', authMiddleware, roleMiddleware(['admin']), exportPayroll)

module.exports = router
