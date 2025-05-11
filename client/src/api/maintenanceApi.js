import { createAPI } from "./fetchClient"

const API = createAPI("/api/maintenance")

export const createTicket = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const getMyTickets = async () => {
  const res = await API.get("/me")
  return res.data
}

export const getAssignedTickets = async () => {
  const res = await API.get("/assigned")
  return res.data
}

export const getAllTickets = async (params = {}) => {
  const qs = new URLSearchParams()
  if (params.status) qs.set("status", params.status)
  if (params.priority) qs.set("priority", params.priority)
  if (params.assigned_to) qs.set("assigned_to", params.assigned_to)
  const query = qs.toString() ? `/?${qs.toString()}` : "/"
  const res = await API.get(query)
  return res.data
}

export const getTicketById = async (id) => {
  const res = await API.get(`/${id}`)
  return res.data
}

// Admin: full update (status, assign, priority, resolution_notes, etc.)
export const updateTicket = async (id, data) => {
  const res = await API.put(`/${id}`, data)
  return res.data
}

// Staff: update own assigned ticket status
export const updateMyTicketStatus = async (id, data) => {
  const apiHost = import.meta.env.VITE_API_URL || ""
  const token = localStorage.getItem("token")
  const res = await fetch(`${apiHost}/api/maintenance/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  })
  const payload = await res.json()
  if (!res.ok) throw new Error(payload?.message || "Request failed")
  return payload
}

export const deleteTicket = async (id) => {
  const res = await API.delete(`/${id}`)
  return res.data
}

export default {
  createTicket,
  getMyTickets,
  getAssignedTickets,
  getAllTickets,
  getTicketById,
  updateTicket,
  updateMyTicketStatus,
  deleteTicket
}
