const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} = require("../models/Student")

const createStudentHandler = async (req, res, next) => {
  try {
    const student = await createStudent(req.body)
    res.status(201).json({ success: true, data: student })
  } catch (error) {
    next(error)
  }
}

const getAllStudentsHandler = async (req, res, next) => {
  try {
    const students = await getAllStudents()
    res.status(200).json({ success: true, data: students })
  } catch (error) {
    next(error)
  }
}

const getStudentByIdHandler = async (req, res, next) => {
  try {
    const student = await getStudentById(req.params.id)
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" })
    }
    res.status(200).json({ success: true, data: student })
  } catch (error) {
    next(error)
  }
}

const updateStudentHandler = async (req, res, next) => {
  try {
    const student = await updateStudent(req.params.id, req.body)
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" })
    }
    res.status(200).json({ success: true, data: student })
  } catch (error) {
    next(error)
  }
}

const deleteStudentHandler = async (req, res, next) => {
  try {
    await deleteStudent(req.params.id)
    res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createStudentHandler,
  getAllStudentsHandler,
  getStudentByIdHandler,
  updateStudentHandler,
  deleteStudentHandler
}
