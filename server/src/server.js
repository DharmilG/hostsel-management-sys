const app = require("./app")
const pool = require("./config/db")
require("dotenv").config()

const PORT = process.env.PORT || 5173

const startServer = async () => {
  try {
    await pool.query("SELECT 1")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    process.exit(1)
  }
}

startServer()
