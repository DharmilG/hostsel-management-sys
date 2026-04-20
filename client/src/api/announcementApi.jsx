import { createAPI } from "./fetchClient"

const API = createAPI("/api/announcements")

export const getAllAnnouncements = async () => {
  const res = await API.get("/")
  return res.data
}

export const createAnnouncement = async (data) => {
  const res = await API.post("/", data)
  return res.data
}
