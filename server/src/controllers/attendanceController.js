const {
  markAttendance,
  getAttendanceByStudent,
  getAllAttendance
} = require("../models/Attendance")

const markAttendanceHandler = async (req, res, next) => {
  try {
    const { student_id, attendance_date, status } = req.body
    const attendance = await markAttendance(student_id, attendance_date, status)
    res.status(201).json({ success: true, data: attendance })
  } catch (error) {
    next(error)
  }
}

const getAttendanceByStudentHandler = async (req, res, next) => {
  try {
    const attendance = await getAttendanceByStudent(req.params.studentId)
    res.status(200).json({ success: true, data: attendance })
  } catch (error) {
    next(error)
  }
}

const getAllAttendanceHandler = async (req, res, next) => {
  try {
    const attendance = await getAllAttendance()
    res.status(200).json({ success: true, data: attendance })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  markAttendanceHandler,
  getAttendanceByStudentHandler,
  getAllAttendanceHandler
}
