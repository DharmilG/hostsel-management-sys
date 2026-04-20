const {
  createShift: createShiftModel,
  getShiftsInRange,
  getShiftById,
  getAssignmentByShiftId,
  assignShift: assignShiftModel,
  unassignShift: unassignShiftModel,
  requestSwap: requestSwapModel
} = require("../models/Shift")

// Create a new shift (admin/staff)
const createShift = async (req, res, next) => {
  try {
    const { title, description, start_time, end_time, role, area, room_id } = req.body || {}
    if (!title || !start_time || !end_time) return res.status(400).json({ success: false, message: "Missing required fields" })
    const created_by = req.user && req.user.id
    const shift = await createShiftModel(title, description, start_time, end_time, role, area, room_id || null, created_by)
    res.status(201).json({ success: true, data: shift })
  } catch (error) {
    next(error)
  }
}

// List shifts in a given range (any authenticated user)
const listShifts = async (req, res, next) => {
  try {
    const start = req.query.start || new Date().toISOString()
    const end = req.query.end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const rows = await getShiftsInRange(start, end)
    res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

const assignShift = async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id)
    if (!shiftId) return res.status(400).json({ success: false, message: "Missing shift id" })

    const requestedUserId = req.body && req.body.userId
    // admins may assign any user; staff can assign themselves
    let userIdToAssign = null
    if (req.user && req.user.role === "admin" && requestedUserId) {
      userIdToAssign = Number(requestedUserId)
    } else if (req.user) {
      userIdToAssign = req.user.id
    }
    if (!userIdToAssign) return res.status(400).json({ success: false, message: "No user to assign" })

    const assignment = await assignShiftModel(shiftId, userIdToAssign)
    res.status(200).json({ success: true, data: assignment })
  } catch (error) {
    next(error)
  }
}

const unassignShift = async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id)
    if (!shiftId) return res.status(400).json({ success: false, message: "Missing shift id" })

    // Simple policy: admin may unassign anyone; assigned user may unassign themselves
    const existing = await getAssignmentByShiftId(shiftId)
    if (!existing) return res.status(404).json({ success: false, message: "No assignment found" })

    if (req.user.role !== "admin" && req.user.id !== existing.user_id) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }

    const removed = await unassignShiftModel(shiftId)
    res.status(200).json({ success: true, data: removed })
  } catch (error) {
    next(error)
  }
}

const requestSwap = async (req, res, next) => {
  try {
    const assignmentId = Number(req.params.id)
    if (!assignmentId) return res.status(400).json({ success: false, message: "Missing assignment id" })

    // only the assigned user can request a swap
    // verify assignment belongs to requester
    const q = await getAssignmentByShiftId(req.body.shiftId || 0)
    if (q && q.id === assignmentId && req.user.id !== q.user_id) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }

    const updated = await requestSwapModel(assignmentId, req.user.id)
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

// Export shifts as an ICS calendar (range)
const exportIcs = async (req, res, next) => {
  try {
    const start = req.query.start || new Date().toISOString()
    const end = req.query.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const rows = await getShiftsInRange(start, end)

    const fmtDate = (iso) => {
      const d = new Date(iso)
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourApp//ShiftRoster//EN\n`;
    for (const s of rows) {
      const uid = `shift-${s.id}@shiftroster`
      ics += `BEGIN:VEVENT\nUID:${uid}\nSUMMARY:${s.title}\nDESCRIPTION:${(s.description || '')}\nDTSTAMP:${fmtDate(new Date().toISOString())}\nDTSTART:${fmtDate(s.start_time)}\nDTEND:${fmtDate(s.end_time)}\nEND:VEVENT\n`
    }
    ics += 'END:VCALENDAR'

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="shifts.ics"`)
    res.send(ics)
  } catch (error) {
    next(error)
  }
}

module.exports = { createShift, listShifts, assignShift, unassignShift, requestSwap, exportIcs }
