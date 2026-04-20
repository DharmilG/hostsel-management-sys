import { createAPI } from "./fetchClient"

const API = createAPI("/api/room-allocations")

export const createRoomAllocation = async (data) => {
  const res = await API.post("/", data)
  return res.data
}

export const deleteRoomAllocation = async (id) => {
  const res = await API.delete(`/${id}`)
  return res.data
}

export default {
  createRoomAllocation,
  deleteRoomAllocation
}
