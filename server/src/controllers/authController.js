const bcrypt = require("bcryptjs")
const https = require("https")
const { generateToken } = require("../config/jwt")
const { createUser, findUserByEmail, updateUserPassword, updateLastLogin } = require("../models/User")

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body || {}

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing fields" })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser(username, email, passwordHash, role)

    res.status(201).json({ success: true, data: user })
  } catch (error) {
    if (error.code === "23505" && error.constraint === "users_username_key") {
      return res.status(409).json({ success: false, message: "Username already exists" })
    }
    if (error.code === "23514" && error.constraint === "users_role_check") {
      return res.status(400).json({ success: false, message: "Invalid role provided" })
    }
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    console.log("Login attempt for:", email)

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" })
    }

    const user = await findUserByEmail(email)
    console.log("User found in DB:", user ? "Yes" : "No")

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    console.log("Password match:", isMatch)

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const token = generateToken({ id: user.id, role: user.role })
    // Update last-login info (server-authoritative) and return updated user info
    try {
      const updated = await updateLastLogin(user.id, 'password')
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          lastLoginAt: updated.last_login_at,
          lastLoginMethod: updated.last_login_method
        }
      })
    } catch (err) {
      // If update fails, still return the basic session info
      console.error('Failed to update last login:', err)
      return res.status(200).json({
        success: true,
        token,
        user: { id: user.id, email: user.email, role: user.role }
      })
    }
  } catch (error) {
    next(error)
  }
}

// Verify Google id_token via Google's tokeninfo endpoint
const verifyGoogleIdToken = (idToken) => {
  return new Promise((resolve, reject) => {
    if (!idToken) return reject(new Error('Missing id_token'))
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    https
      .get(url, (resp) => {
        let data = ''
        resp.on('data', (chunk) => (data += chunk))
        resp.on('end', () => {
          if (resp.statusCode !== 200) return reject(new Error('Invalid id_token'))
          try {
            const payload = JSON.parse(data)
            resolve(payload)
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', (err) => reject(err))
  })
}

const fetchGoogleProfileWithAccessToken = (accessToken) => {
  return new Promise((resolve, reject) => {
    if (!accessToken) return reject(new Error('Missing access_token'))
    const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    https
      .get(url, (resp) => {
        let data = ''
        resp.on('data', (chunk) => (data += chunk))
        resp.on('end', () => {
          if (resp.statusCode !== 200) return reject(new Error('Failed to fetch profile'))
          try {
            const payload = JSON.parse(data)
            resolve(payload)
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', (err) => reject(err))
  })
}

const googleAuth = async (req, res, next) => {
  try {
    const body = req.body || {}
    let profile = null

    if (body.id_token) {
      // Verify ID token and extract profile
      const payload = await verifyGoogleIdToken(body.id_token)
      // optional: verify audience matches server config
      if (process.env.GOOGLE_CLIENT_ID && payload.aud && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({ success: false, message: 'Invalid Google client id' })
      }
      profile = {
        email: payload.email,
        name: payload.name,
        sub: payload.sub,
        picture: payload.picture,
      }
    } else if (body.access_token) {
      const payload = await fetchGoogleProfileWithAccessToken(body.access_token)
      profile = {
        email: payload.email,
        name: payload.name,
        sub: payload.sub,
        picture: payload.picture,
      }
    } else if (body.email) {
      // fallback when client already sends a profile object
      profile = { email: body.email, name: body.name || body.email.split('@')[0], sub: body.sub, picture: body.picture }
    } else {
      return res.status(400).json({ success: false, message: 'Missing Google credentials' })
    }

    if (!profile || !profile.email) {
      return res.status(400).json({ success: false, message: 'Unable to obtain email from Google profile' })
    }

    // Check for existing user
    const existing = await findUserByEmail(profile.email)
    if (existing) {
      const updated = await updateLastLogin(existing.id, 'google')
      const token = generateToken({ id: existing.id, role: existing.role })
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          lastLoginAt: updated.last_login_at,
          lastLoginMethod: updated.last_login_method,
        },
      })
    }

    // Create new user (social sign-up). Use a random password hash so password login isn't possible without reset.
    const username = profile.name || profile.email.split('@')[0]
    const randomSeed = `google:${profile.sub}:${Date.now()}`
    const passwordHash = await bcrypt.hash(randomSeed, 10)
    const newUser = await createUser(username, profile.email, passwordHash, 'student')
    const updated = await updateLastLogin(newUser.id, 'google')
    const token = generateToken({ id: newUser.id, role: newUser.role })
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        lastLoginAt: updated.last_login_at,
        lastLoginMethod: updated.last_login_method,
      },
    })
  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body || {}

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing fields" })
    }

    const user = await findUserByEmail(email)
    // don't reveal whether the email exists
    if (!user) {
      return res
        .status(200)
        .json({ success: true, message: "If an account exists, the password has been reset" })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await updateUserPassword(email, passwordHash)

    res.status(200).json({ success: true, message: "Password has been updated" })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, resetPassword, googleAuth }
