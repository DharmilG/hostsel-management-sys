import axios from "axios"

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/students"
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getAllStudents = async () => {
  const res = await API.get("/")
  return res.data
}

export const getStudentById = async (id) => {
  const res = await API.get(`/${id}`)
  return res.data
}

export const createStudent = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const updateStudent = async (id, data) => {
  const res = await API.put(`/${id}`, data)
  return res.data
}

export const deleteStudent = async (id) => {
  const res = await API.delete(`/${id}`)
  return res.data
}
