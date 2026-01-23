import axios from "axios"

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/announcements"
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getAllAnnouncements = async () => {
  const res = await API.get("/")
  return res.data
}

export const createAnnouncement = async (data) => {
  const res = await API.post("/", data)
  return res.data
}
