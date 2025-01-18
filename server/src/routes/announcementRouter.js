const express = require("express")
const {
  createAnnouncementHandler,
  getAllAnnouncementsHandler
} = require("../controllers/announcementController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, roleMiddleware(["admin"]), createAnnouncementHandler)
router.get("/", authMiddleware, getAllAnnouncementsHandler)

module.exports = router