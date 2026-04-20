require("dotenv").config()
const app = require("./app")
const pool = require("./config/db")

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await pool.query("SELECT 1")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error(error)
    if (error.message.includes("does not support SSL")) {
      console.log("\n❌ SSL Error: You are connecting to a local database, but 'src/config/db.js' is configured for SSL (Supabase). Disable SSL in db.js for local development.\n")
    }
    process.exit(1)
  }
}

startServer()
