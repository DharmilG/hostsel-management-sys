import axios from "axios"

const API = axios.create({
  baseURL: "/api/notifications"
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getNotificationsByStudent = async (studentId) => {
  const res = await API.get(`/student/${studentId}`)
  return res.data
}

export const markNotificationRead = async (id) => {
  const res = await API.put(`/${id}/read`)
  return res.data
}
