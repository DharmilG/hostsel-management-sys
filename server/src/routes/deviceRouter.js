const express = require('express')
const { registerDevice, listDevices, getDeviceLogsHandler } = require('../controllers/deviceController')
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')

const router = express.Router()

// Admin: register new device
router.post('/', authMiddleware, roleMiddleware(['admin']), registerDevice)
// Admin: list
router.get('/', authMiddleware, roleMiddleware(['admin']), listDevices)
// Admin: device logs
router.get('/:id/logs', authMiddleware, roleMiddleware(['admin']), getDeviceLogsHandler)

module.exports = router
