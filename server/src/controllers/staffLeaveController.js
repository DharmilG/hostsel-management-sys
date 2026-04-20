const {
  createLeaveRequest,
  getLeaveRequestsByStaff,
  getAllLeaveRequests,
  getPendingRequests,
  updateLeaveRequestStatus,
  cancelLeaveRequest
} = require("../models/StaffLeaveRequest")

const { findUserById } = require("../models/User")

const createLeaveRequestHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    const payload = { ...req.body }

    // If no staff_id provided, default to authenticated user
    if (!payload.staff_id) {
      if (!authUser.id) return res.status(401).json({ success: false, message: "Unauthorized" })
      payload.staff_id = authUser.id
    }

    // ensure ISO timestamps or pass-through
    const leave = await createLeaveRequest(payload)
    res.status(201).json({ success: true, data: leave })
  } catch (error) {
    next(error)
  }
}

const getMyLeaveRequestsHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    if (!authUser.id) return res.status(401).json({ success: false, message: "Unauthorized" })
    const leaves = await getLeaveRequestsByStaff(authUser.id)
    res.status(200).json({ success: true, data: leaves })
  } catch (error) {
    next(error)
  }
}

const getAllLeaveRequestsHandler = async (req, res, next) => {
  try {
    const leaves = await getAllLeaveRequests()
    res.status(200).json({ success: true, data: leaves })
  } catch (error) {
    next(error)
  }
}

const getPendingRequestsHandler = async (req, res, next) => {
  try {
    const leaves = await getPendingRequests()
    res.status(200).json({ success: true, data: leaves })
  } catch (error) {
    next(error)
  }
}

const approveRequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const adminId = req.user && req.user.id
    const { admin_comment } = req.body
    const updated = await updateLeaveRequestStatus(id, "approved", adminId, admin_comment || null)
    if (!updated) return res.status(404).json({ success: false, message: "Request not found" })
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const denyRequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const adminId = req.user && req.user.id
    const { admin_comment } = req.body
    const updated = await updateLeaveRequestStatus(id, "denied", adminId, admin_comment || null)
    if (!updated) return res.status(404).json({ success: false, message: "Request not found" })
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const cancelRequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const authUser = req.user || {}
    if (!authUser.id) return res.status(401).json({ success: false, message: "Unauthorized" })
    const cancelled = await cancelLeaveRequest(id, authUser.id)
    if (!cancelled) return res.status(404).json({ success: false, message: "Request not found or not owned by user" })
    res.status(200).json({ success: true, data: cancelled })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createLeaveRequestHandler,
  getMyLeaveRequestsHandler,
  getAllLeaveRequestsHandler,
  getPendingRequestsHandler,
  approveRequestHandler,
  denyRequestHandler,
  cancelRequestHandler
}
