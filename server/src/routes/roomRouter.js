const express = require("express")
const {
  createRoomHandler,
  getAllRoomsHandler,
  getRoomByIdHandler,
  updateRoomHandler,
  deleteRoomHandler
} = require("../controllers/roomController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, roleMiddleware(["admin"]), createRoomHandler)
router.get("/", authMiddleware, getAllRoomsHandler)
router.get("/:id", authMiddleware, getRoomByIdHandler)
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateRoomHandler)
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteRoomHandler)

module.exports = router
