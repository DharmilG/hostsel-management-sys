import { createAPI } from "./fetchClient"

const API = createAPI("/api/staff/leave-requests")

export const createLeaveRequest = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const getMyLeaveRequests = async () => {
  const res = await API.get("/me")
  return res.data
}

export const getPendingRequests = async () => {
  const res = await API.get("/pending")
  return res.data
}

export const getAllLeaveRequests = async () => {
  const res = await API.get("/")
  return res.data
}

export const approveRequest = async (id, data = {}) => {
  const res = await API.put(`/${id}/approve`, data)
  return res.data
}

export const denyRequest = async (id, data = {}) => {
  const res = await API.put(`/${id}/deny`, data)
  return res.data
}

export const cancelRequest = async (id) => {
  const res = await API.put(`/${id}/cancel`)
  return res.data
}

export default {
  createLeaveRequest,
  getMyLeaveRequests,
  getPendingRequests,
  getAllLeaveRequests,
  approveRequest,
  denyRequest,
  cancelRequest
}
