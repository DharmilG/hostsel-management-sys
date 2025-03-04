const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const { createDevice, getDeviceById, getAllDevices, updateLastSeen } = require("../models/Device")
const { getLogsByDevice } = require("../models/ClockLog")

const registerDevice = async (req, res, next) => {
  try {
    const { name, type, location } = req.body || {}
    if (!name) return res.status(400).json({ success: false, message: "Missing device name" })

    const rawKey = crypto.randomBytes(24).toString("hex")
    const hash = await bcrypt.hash(rawKey, 10)

    const device = await createDevice(name, type || 'kiosk', location || {}, hash, req.user && req.user.id)

    // return raw key only once
    res.status(201).json({ success: true, data: device, api_key: rawKey })
  } catch (error) {
    next(error)
  }
}

const listDevices = async (req, res, next) => {
  try {
    const devices = await getAllDevices()
    res.status(200).json({ success: true, data: devices })
  } catch (error) {
    next(error)
  }
}

const getDeviceLogsHandler = async (req, res, next) => {
  try {
    const deviceId = Number(req.params.id)
    if (!deviceId) return res.status(400).json({ success: false, message: "Missing device id" })
    const logs = await getLogsByDevice(deviceId)
    // update last seen for device
    await updateLastSeen(deviceId)
    res.status(200).json({ success: true, data: logs })
  } catch (error) {
    next(error)
  }
}

module.exports = { registerDevice, listDevices, getDeviceLogsHandler }
