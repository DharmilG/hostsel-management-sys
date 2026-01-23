const express = require("express")
const {
  createStudentHandler,
  getAllStudentsHandler,
  getStudentByIdHandler,
  updateStudentHandler,
  deleteStudentHandler
} = require("../controllers/studentController")
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")

const router = express.Router()

router.post("/", authMiddleware, roleMiddleware(["admin"]), createStudentHandler)
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllStudentsHandler)
router.get("/:id", authMiddleware, getStudentByIdHandler)
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateStudentHandler)
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteStudentHandler)

module.exports = router
