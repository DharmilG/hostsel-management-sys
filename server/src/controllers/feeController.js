const {
  createFee,
  getFeesByStudent,
  getAllFees,
  updateFeeStatus
} = require("../models/Fee")

const createFeeHandler = async (req, res, next) => {
  try {
    const fee = await createFee(req.body)
    res.status(201).json({ success: true, data: fee })
  } catch (error) {
    next(error)
  }
}

const getFeesByStudentHandler = async (req, res, next) => {
  try {
    const fees = await getFeesByStudent(req.params.studentId)
    res.status(200).json({ success: true, data: fees })
  } catch (error) {
    next(error)
  }
}

const getAllFeesHandler = async (req, res, next) => {
  try {
    const fees = await getAllFees()
    res.status(200).json({ success: true, data: fees })
  } catch (error) {
    next(error)
  }
}

const updateFeeStatusHandler = async (req, res, next) => {
  try {
    const { payment_status, payment_date } = req.body
    const fee = await updateFeeStatus(req.params.id, payment_status, payment_date)
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee record not found" })
    }
    res.status(200).json({ success: true, data: fee })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createFeeHandler,
  getFeesByStudentHandler,
  getAllFeesHandler,
  updateFeeStatusHandler
}
