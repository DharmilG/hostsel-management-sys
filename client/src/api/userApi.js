import { createAPI } from "./fetchClient"

const API = createAPI("/api/users")

// Get all users (admin only). Pass role="staff" to filter by role.
export const getUsers = async (params = {}) => {
  const qs = new URLSearchParams()
  if (params.role) qs.set("role", params.role)
  const query = qs.toString() ? `/?${qs.toString()}` : "/"
  const res = await API.get(query)
  return res.data
}

export const getAllStaff = async () => getUsers({ role: "staff" })

export default { getUsers, getAllStaff }
