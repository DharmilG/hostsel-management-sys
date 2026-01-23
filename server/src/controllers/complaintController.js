const {
  createComplaint,
  getAllComplaints,
  getComplaintsByStudent,
  updateComplaintStatus
} = require("../models/Complaint")

const createComplaintHandler = async (req, res, next) => {
  try {
    const complaint = await createComplaint(req.body)
    res.status(201).json({ success: true, data: complaint })
  } catch (error) {
    next(error)
  }
}

const getAllComplaintsHandler = async (req, res, next) => {
  try {
    const complaints = await getAllComplaints()
    res.status(200).json({ success: true, data: complaints })
  } catch (error) {
    next(error)
  }
}

const getComplaintsByStudentHandler = async (req, res, next) => {
  try {
    const complaints = await getComplaintsByStudent(req.params.studentId)
    res.status(200).json({ success: true, data: complaints })
  } catch (error) {
    next(error)
  }
}

const updateComplaintStatusHandler = async (req, res, next) => {
  try {
    const { status } = req.body
    const complaint = await updateComplaintStatus(req.params.id, status)
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" })
    }
    res.status(200).json({ success: true, data: complaint })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createComplaintHandler,
  getAllComplaintsHandler,
  getComplaintsByStudentHandler,
  updateComplaintStatusHandler
}
