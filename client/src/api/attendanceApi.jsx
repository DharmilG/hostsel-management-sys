import { createAPI } from "./fetchClient"

const API = createAPI("/api/attendance")

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
