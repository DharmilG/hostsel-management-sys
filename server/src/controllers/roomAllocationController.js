const {
  createRoomAllocation,
  getLatestAllocationByStudent,
  deleteRoomAllocation
} = require("../models/RoomAllocation")

const createRoomAllocationHandler = async (req, res, next) => {
  try {
    const { student_id, room_id } = req.body || {}
    if (!student_id || !room_id) {
      return res.status(400).json({ success: false, message: "student_id and room_id are required" })
    }
    const allocation = await createRoomAllocation(student_id, room_id)
    res.status(201).json({ success: true, data: allocation })
  } catch (error) {
    next(error)
  }
}

const deleteRoomAllocationHandler = async (req, res, next) => {
  try {
    await deleteRoomAllocation(req.params.id)
    res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createRoomAllocationHandler,
  deleteRoomAllocationHandler
}
