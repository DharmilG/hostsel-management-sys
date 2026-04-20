const {
  createComplaint,
  getAllComplaints,
  getComplaintsByStudent,
  updateComplaintStatus
} = require("../models/Complaint")
const { getStudentByUserId, getStudentById, createStudent } = require("../models/Student")
const { findUserById } = require("../models/User")

const createComplaintHandler = async (req, res, next) => {
  try {
    const authUser = req.user || {}
    let studentId = req.body.student_id

    // If no student_id provided, try to map authenticated user to a student profile
    if (!studentId) {
      if (!authUser.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" })
      }

      // Find student record linked to this user
      let student = await getStudentByUserId(authUser.id)

      if (!student) {
        // If the authenticated user is a student, create a minimal student profile automatically
        if (authUser.role === "student") {
          const user = await findUserById(authUser.id)
          const newStudent = await createStudent({
            user_id: authUser.id,
            roll_no: "N/A",
            full_name: user?.username || user?.email || "Student",
            course: "",
            year: 0,
            contact_number: "",
            email: user?.email || "",
            emergency_contact: "",
            address: ""
          })
          studentId = newStudent.id
        } else {
          return res.status(400).json({ success: false, message: "student_id is required" })
        }
      } else {
        studentId = student.id
      }
    } else {
      // Validate provided student_id exists. Accept either a students.id or a users.id (fallback).
      let target = await getStudentById(studentId)
      if (!target) {
        // maybe caller sent a user id instead of a student id
        target = await getStudentByUserId(studentId)
      }
      if (!target) {
        return res.status(400).json({ success: false, message: "Student not found" })
      }
      studentId = target.id
    }

    const payload = { ...req.body, student_id: studentId }
    const complaint = await createComplaint(payload)
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
    const paramId = req.params.studentId

    // Try to resolve the parameter to a student record. The param may be a students.id or a users.id.
    let student = null
    if (paramId === "me" && req.user && req.user.id) {
      student = await getStudentByUserId(req.user.id)
    } else {
      student = await getStudentById(paramId)
      if (!student) {
        // Maybe the client passed a user id instead of a student id
        student = await getStudentByUserId(paramId)
      }
    }

    if (!student) {
      // No student record found -> return empty list rather than error
      return res.status(200).json({ success: true, data: [] })
    }

    const complaints = await getComplaintsByStudent(student.id)
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
