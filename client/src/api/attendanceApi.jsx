import axios from "axios"

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/attendance"
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const markAttendance = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const getAttendanceByStudent = async (studentId) => {
  const res = await API.get(`/student/${studentId}`)
  return res.data
}

export const getAllAttendance = async () => {
  const res = await API.get("/")
  return res.data
}
