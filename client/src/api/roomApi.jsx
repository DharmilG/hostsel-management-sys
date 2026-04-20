import { createAPI } from "./fetchClient"

const API = createAPI("/api/rooms")

export const getAllRooms = async () => {
  const res = await API.get("/")
  return res.data
}

export const getRoomById = async (id) => {
  const res = await API.get(`/${id}`)
  return res.data
}

export const createRoom = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const updateRoom = async (id, data) => {
  const res = await API.put(`/${id}`, data)
  return res.data
}

export const deleteRoom = async (id) => {
  const res = await API.delete(`/${id}`)
  return res.data
}
