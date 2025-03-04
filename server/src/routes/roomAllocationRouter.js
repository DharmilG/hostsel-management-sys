const express = require("express")
const {
  createRoomAllocationHandler,
  deleteRoomAllocationHandler
} = require("../controllers/roomAllocationController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, roleMiddleware(["admin"]), createRoomAllocationHandler)
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteRoomAllocationHandler)

module.exports = router
