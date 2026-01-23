const { verifyToken } = require("../config/jwt")

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    const decoded = verifyToken(token)
    console.log(decoded)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" })
  }
}

module.exports = authMiddleware