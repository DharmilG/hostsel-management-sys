const express = require("express")
const cors = require("cors")
const authRouter = require("./routes/authRouter")
const studentRouter = require("./routes/studentRouter")
const roomRouter = require("./routes/roomRouter")
const attendanceRouter = require("./routes/attendanceRouter")
const complaintRouter = require("./routes/complaintRouter")
const feeRouter = require("./routes/feeRouter")
const notificationRouter = require("./routes/notificationRouter")
const announcementRouter = require("./routes/announcementRouter")
require("dotenv").config()

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true
  })
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get("/", (req, res) => {
  res.send("Server is running")
})

app.use("/api/auth", authRouter)
app.use("/api/students", studentRouter)
app.use("/api/rooms", roomRouter)
app.use("/api/attendance", attendanceRouter)
app.use("/api/complaints", complaintRouter)
app.use("/api/fees", feeRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/announcements", announcementRouter)


app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  })
})

app.use((err, req, res, next) => {
  if (err.code === "23503") {
    return res.status(400).json({ success: false, message: "Invalid reference: The referenced ID does not exist." })
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  })
})

module.exports = app
