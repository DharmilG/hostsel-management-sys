import axios from "axios"

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/auth"
})

export const loginUser = async (credentials) => {
  const response = await API.post("/login", credentials)
  return response.data
}

export const registerUser = async (data) => {
  const response = await API.post("/register", data)
  return response.data
}
