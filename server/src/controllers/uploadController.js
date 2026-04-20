const multer = require("multer")
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads")
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// Allowed mime types for uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_FILES = 5

// Multer storage: saves files with unique names to preserve originals
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex")
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${unique}${ext}`)
  }
})

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed. Allowed types: images, PDF, Word docs, plain text.`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
})

// ─── Middleware ────────────────────────────────────────────────────────────────
// Use as: router.post("/", authMiddleware, uploadMiddleware, uploadFileHandler)
const uploadMiddleware = (req, res, next) => {
  const uploader = upload.array("files", MAX_FILES)
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Max size is 10MB per file." })
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: `Too many files. Max ${MAX_FILES} files allowed.` })
      }
      return res.status(400).json({ success: false, message: err.message })
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next()
  })
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/uploads
 * Upload one or more files. Returns array of file_ref objects.
 */
const uploadFileHandler = (req, res) => {
  const files = req.files || []
  if (files.length === 0) {
    return res.status(400).json({ success: false, message: "No files uploaded." })
  }

  const uploaded = files.map((f) => ({
    file_ref: f.filename,           // unique stored filename (used as DB key)
    original_name: f.originalname,  // original filename shown to users
    mime_type: f.mimetype,
    size: f.size
  }))

  res.status(201).json({ success: true, data: uploaded })
}

/**
 * GET /api/uploads/:filename
 * Serve / download a stored file.
 * Appends Content-Disposition: attachment when ?download=1 query is present.
 */
const serveFileHandler = (req, res) => {
  const { filename } = req.params
  // Prevent directory traversal
  const safeName = path.basename(filename)
  const filePath = path.join(UPLOADS_DIR, safeName)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found." })
  }

  const forceDownload = req.query.download === "1"
  if (forceDownload) {
    // Use original name from query if provided (set by client)
    const downloadName = req.query.name ? decodeURIComponent(req.query.name) : safeName
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`)
  }

  res.sendFile(filePath)
}

/**
 * DELETE /api/uploads/:filename
 * Delete a stored file from disk. Admin only (caller should enforce role check before calling).
 */
const deleteFileHandler = (req, res) => {
  const { filename } = req.params
  const safeName = path.basename(filename)
  const filePath = path.join(UPLOADS_DIR, safeName)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found." })
  }

  fs.unlinkSync(filePath)
  res.json({ success: true, message: "File deleted." })
}

module.exports = {
  uploadMiddleware,
  uploadFileHandler,
  serveFileHandler,
  deleteFileHandler,
  UPLOADS_DIR
}
