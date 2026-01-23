const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom
} = require("../models/Room")

const createRoomHandler = async (req, res, next) => {
  try {
    const room = await createRoom(req.body)
    res.status(201).json({ success: true, data: room })
  } catch (error) {
    next(error)
  }
}

const getAllRoomsHandler = async (req, res, next) => {
  try {
    const rooms = await getAllRooms()
    res.status(200).json({ success: true, data: rooms })
  } catch (error) {
    next(error)
  }
}

const getRoomByIdHandler = async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id)
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" })
    }
    res.status(200).json({ success: true, data: room })
  } catch (error) {
    next(error)
  }
}

const updateRoomHandler = async (req, res, next) => {
  try {
    const room = await updateRoom(req.params.id, req.body)
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" })
    }
    res.status(200).json({ success: true, data: room })
  } catch (error) {
    next(error)
  }
}

const deleteRoomHandler = async (req, res, next) => {
  try {
    await deleteRoom(req.params.id)
    res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createRoomHandler,
  getAllRoomsHandler,
  getRoomByIdHandler,
  updateRoomHandler,
  deleteRoomHandler
}
