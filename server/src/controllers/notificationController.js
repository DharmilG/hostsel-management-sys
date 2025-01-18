const {
  createNotification,
  getNotificationsByStudent,
  markNotificationRead
} = require("../models/Notification")

const getNotificationsByStudentHandler = async (req, res, next) => {
  try {
    const notifications = await getNotificationsByStudent(req.params.studentId)
    res.status(200).json({ success: true, data: notifications })
  } catch (error) {
    next(error)
  }
}

const markNotificationReadHandler = async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.params.id)
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" })
    }
    res.status(200).json({ success: true, data: notification })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNotificationsByStudentHandler,
  markNotificationReadHandler
}
