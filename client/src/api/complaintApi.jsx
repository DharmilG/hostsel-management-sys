import axios from "axios"

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/complaints"
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getAllComplaints = async () => {
  const res = await API.get("/")
  return res.data
}

export const getComplaintsByStudent = async (studentId) => {
  const res = await API.get(`/student/${studentId}`)
  return res.data
}

export const createComplaint = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const updateComplaintStatus = async (id, data) => {
  const res = await API.put(`/${id}/status`, data)
  return res.data
}
