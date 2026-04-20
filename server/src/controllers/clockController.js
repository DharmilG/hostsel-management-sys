const bcrypt = require("bcryptjs")
const { createClockLog, getLogsByUser, getLogsInRange } = require("../models/ClockLog")
const { getDeviceById } = require("../models/Device")
const { findUserById } = require("../models/User")

// Helper: verify device key header
const verifyDeviceKey = async (deviceId, providedKey) => {
  if (!deviceId || !providedKey) return false
  const device = await getDeviceById(deviceId)
  if (!device || !device.api_key_hash) return false
  return await bcrypt.compare(providedKey, device.api_key_hash)
}

const createClock = async (req, res, next) => {
  try {
    const body = req.body || {}
    let userId = req.user && req.user.id

    // If no JWT user, allow device-auth flow: headers X-Device-Id + X-Device-Key and body.user_id
    if (!userId) {
      const deviceIdHeader = req.headers['x-device-id'] || req.body.device_id
      const deviceKey = req.headers['x-device-key'] || req.headers['authorization'] && req.headers['authorization'].startsWith('Device ') ? req.headers['authorization'].split(' ')[1] : null

      if (deviceIdHeader && deviceKey && body.user_id) {
        const ok = await verifyDeviceKey(Number(deviceIdHeader), deviceKey)
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid device credentials' })
        userId = Number(body.user_id)
      }
    }

    if (!userId) return res.status(401).json({ success: false, message: 'Missing user identity' })

    const device_id = body.device_id || null
    const event_type = body.event_type || 'clock_in'
    const method = body.method || 'qr'
    const client_event_id = body.client_event_id || null
    const metadata = body.metadata || {}

    const created = await createClockLog({ device_id, user_id: userId, event_type, method, client_event_id, metadata })
    res.status(201).json({ success: true, data: created })
  } catch (error) {
    // if unique client_event_id violation, return 200 with existing
    if (error && error.code === '23505') {
      return res.status(200).json({ success: true, message: 'duplicate', data: null })
    }
    next(error)
  }
}

const createClockBatch = async (req, res, next) => {
  try {
    const events = Array.isArray(req.body) ? req.body : (req.body.events || [])
    const results = []
    for (const ev of events) {
      try {
        const created = await createClockLog({
          device_id: ev.device_id || null,
          user_id: ev.user_id || null,
          event_type: ev.event_type,
          method: ev.method || 'api',
          client_event_id: ev.client_event_id || null,
          metadata: ev.metadata || {}
        })
        results.push({ success: true, data: created, client_event_id: ev.client_event_id || null })
      } catch (e) {
        if (e && e.code === '23505') {
          // duplicate client id
          results.push({ success: true, message: 'duplicate', client_event_id: ev.client_event_id || null })
          continue
        }
        results.push({ success: false, error: e.message || String(e), client_event_id: ev.client_event_id || null })
      }
    }
    res.status(200).json({ success: true, results })
  } catch (error) {
    next(error)
  }
}

// Simple timesheet aggregation endpoint
const getTimesheet = async (req, res, next) => {
  try {
    const qUser = req.query.user_id || (req.user && req.user.id) || 'me'
    let userId = null
    if (qUser === 'me') {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
      userId = req.user.id
    } else {
      userId = Number(qUser)
      if (!userId) return res.status(400).json({ success: false, message: 'Invalid user id' })
      // only admin may request others
      if (!req.user || (req.user.role !== 'admin' && req.user.id !== userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }
    }

    const start = req.query.start || null
    const end = req.query.end || null
    const logs = await getLogsByUser(userId, start, end)

    // Pair clock_in -> clock_out
    const pairs = []
    let currentStart = null
    for (const l of logs) {
      if (l.event_type === 'clock_in') {
        currentStart = l
      } else if (l.event_type === 'clock_out' && currentStart) {
        const startTs = new Date(currentStart.created_at).getTime()
        const endTs = new Date(l.created_at).getTime()
        const seconds = Math.max(0, Math.floor((endTs - startTs) / 1000))
        pairs.push({ in: currentStart.created_at, out: l.created_at, seconds })
        currentStart = null
      }
    }

    // sum
    const totalSeconds = pairs.reduce((s, p) => s + (p.seconds || 0), 0)
    const totalHours = totalSeconds / 3600

    // simple weekly threshold for overtime (configurable later)
    const weeklyThresholdHours = Number(process.env.TIMESHEET_WEEKLY_THRESHOLD_HOURS || 40)
    const regularSeconds = Math.min(totalSeconds, weeklyThresholdHours * 3600)
    const overtimeSeconds = Math.max(0, totalSeconds - regularSeconds)

    const user = await findUserById(userId)

    res.status(200).json({
      success: true,
      data: {
        user: { id: userId, username: user?.username, email: user?.email },
        pairs,
        total_seconds: totalSeconds,
        total_hours: totalHours,
        regular_seconds: regularSeconds,
        overtime_seconds: overtimeSeconds
      }
    })
  } catch (error) {
    next(error)
  }
}

// Payroll CSV export (simple weekly totals per user)
const exportPayroll = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' })
    const start = req.query.start
    const end = req.query.end
    if (!start || !end) return res.status(400).json({ success: false, message: 'start and end required' })

    const rows = await getLogsInRange(start, end)

    // group by user
    const byUser = {}
    for (const r of rows) {
      const uid = r.user_id || 'unknown'
      byUser[uid] = byUser[uid] || []
      byUser[uid].push(r)
    }

    const lines = []
    lines.push('user_id,username,total_hours,regular_hours,overtime_hours')

    const weeklyThresholdHours = Number(process.env.TIMESHEET_WEEKLY_THRESHOLD_HOURS || 40)

    for (const uid of Object.keys(byUser)) {
      const logs = byUser[uid].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      // pair
      let totalSeconds = 0
      let currentStart = null
      for (const l of logs) {
        if (l.event_type === 'clock_in') currentStart = l
        else if (l.event_type === 'clock_out' && currentStart) {
          const startTs = new Date(currentStart.created_at).getTime()
          const endTs = new Date(l.created_at).getTime()
          totalSeconds += Math.max(0, Math.floor((endTs - startTs) / 1000))
          currentStart = null
        }
      }
      const totalHours = totalSeconds / 3600
      const regularHours = Math.min(totalHours, weeklyThresholdHours)
      const overtimeHours = Math.max(0, totalHours - regularHours)
      const user = await findUserById(Number(uid))
      const username = user?.username || ''
      lines.push(`${uid},"${username}",${totalHours.toFixed(2)},${regularHours.toFixed(2)},${overtimeHours.toFixed(2)}`)
    }

    const csv = lines.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="payroll_${start}_${end}.csv"`)
    res.send(csv)
  } catch (error) {
    next(error)
  }
}

module.exports = { createClock, createClockBatch, getTimesheet, exportPayroll }
