const express = require("express")
const router = express.Router()
const path = require("path")
const authMiddleware = require("../middlewares/authMiddleware")
const {
  uploadMiddleware,
  uploadFileHandler,
  serveFileHandler,
  deleteFileHandler
} = require("../controllers/uploadController")

// POST /api/uploads — upload one or more files (authenticated)
// Returns array of { file_ref, original_name, mime_type, size } objects
router.post("/", authMiddleware, uploadMiddleware, uploadFileHandler)

// GET /api/uploads/:filename — serve/download a stored file (authenticated)
router.get("/:filename", authMiddleware, serveFileHandler)

// DELETE /api/uploads/:filename — delete a stored file (authenticated)
router.delete("/:filename", authMiddleware, deleteFileHandler)

module.exports = router
