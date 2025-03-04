import { createAPI } from "./fetchClient"

const API = createAPI("/api/fees")

export const getAllFees = async () => {
  const res = await API.get("/")
  return res.data
}

export const getFeesByStudent = async (studentId) => {
  const res = await API.get(`/student/${studentId}`)
  return res.data
}

export const createFee = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const updateFeeStatus = async (id, data) => {
  const res = await API.put(`/${id}/status`, data)
  return res.data
}
