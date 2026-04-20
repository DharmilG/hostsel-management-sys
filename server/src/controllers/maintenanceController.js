const {
  createTicket,
  getAllTickets,
  getTicketsByStudent,
  getTicketsByUser,
  getTicketById,
  getAssignedTickets,
  updateTicket,
  deleteTicket
} = require("../models/MaintenanceTicket")
const { getStudentByUserId } = require("../models/Student")

// ─── Create ──────────────────────────────────────────────────────────────────

const createTicketHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    if (!authUser.id) return res.status(401).json({ success: false, message: "Unauthorized" })

    const payload = { ...req.body }

    // Attach reporter identity based on role
    if (authUser.role === "student") {
      // Map user id -> student record
      const student = await getStudentByUserId(authUser.id)
      if (student) {
        payload.raised_by_student_id = student.id
      } else {
        payload.raised_by_user_id = authUser.id
      }
    } else {
      // staff or admin
      payload.raised_by_user_id = authUser.id
    }

    const ticket = await createTicket(payload)
    res.status(201).json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

const getAllTicketsHandler = async (req, res, next) => {
  try {
    const { status, priority, assigned_to } = req.query
    const tickets = await getAllTickets({ status, priority, assigned_to })
    res.status(200).json({ success: true, data: tickets })
  } catch (err) {
    next(err)
  }
}

const getMyTicketsHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    if (!authUser.id) return res.status(401).json({ success: false, message: "Unauthorized" })

    let tickets = []
    if (authUser.role === "student") {
      const student = await getStudentByUserId(authUser.id)
      if (student) {
        tickets = await getTicketsByStudent(student.id)
      }
    } else {
      tickets = await getTicketsByUser(authUser.id)
    }
    res.status(200).json({ success: true, data: tickets })
  } catch (err) {
    next(err)
  }
}

const getAssignedTicketsHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    if (!authUser.id) return res.status(401).json({ success: false, message: "Unauthorized" })
    const tickets = await getAssignedTickets(authUser.id)
    res.status(200).json({ success: true, data: tickets })
  } catch (err) {
    next(err)
  }
}

const getTicketByIdHandler = async (req, res, next) => {
  try {
    const ticket = await getTicketById(req.params.id)
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" })
    res.status(200).json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

const updateTicketHandler = async (req, res, next) => {
  try {
    const ticket = await updateTicket(req.params.id, req.body)
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" })
    res.status(200).json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
}

// Staff marks their assigned ticket as in_progress or resolved
const updateMyTicketStatusHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    const { status, resolution_notes } = req.body
    const allowed = ["in_progress", "resolved"]
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(", ")}` })
    }
    const existing = await getTicketById(req.params.id)
    if (!existing) return res.status(404).json({ success: false, message: "Ticket not found" })
    if (existing.assigned_to !== authUser.id) {
      return res.status(403).json({ success: false, message: "You are not assigned to this ticket" })
    }
    const ticket = await updateTicket(req.params.id, { status, resolution_notes })
    res.status(200).json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
}

const deleteTicketHandler = async (req, res, next) => {
  try {
    const ticket = await deleteTicket(req.params.id)
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" })
    res.status(200).json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createTicketHandler,
  getAllTicketsHandler,
  getMyTicketsHandler,
  getAssignedTicketsHandler,
  getTicketByIdHandler,
  updateTicketHandler,
  updateMyTicketStatusHandler,
  deleteTicketHandler
}
