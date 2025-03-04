import { createAPI } from "./fetchClient"

const API = createAPI("/api/notifications")

export const getNotificationsByStudent = async (studentId) => {
  const res = await API.get(`/student/${studentId}`)
  return res.data
}

export const markNotificationRead = async (id) => {
  const res = await API.put(`/${id}/read`)
  return res.data
}
