import { createAPI } from "./fetchClient"

const API = createAPI("/api/auth")

export const loginUser = async (credentials) => {
  const response = await API.post("/login", credentials)
  return response.data
}

export const registerUser = async (data) => {
  const response = await API.post("/register", data)
  return response.data
}

export const resetPassword = async (data) => {
  const response = await API.post("/reset-password", data)
  return response.data
}

// Social / OAuth helpers
export const googleAuth = async (data) => {
  const response = await API.post("/google", data)
  return response.data
}
