import { createAPI } from './fetchClient'

const API = createAPI('/api/tasks')

export const createTask = async (data) => {
  const res = await API.post('/', data)
  return res.data
}

export const listTasks = async (params) => {
  const qs = new URLSearchParams(params || {}).toString()
  const res = await API.get(`/?${qs}`)
  const payload = res.data
  if (payload && payload.success && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.data)) return payload.data
  // fallback: if server returned array directly or payload is the array
  if (Array.isArray(payload)) return payload
  return []
}

export const getTask = async (id) => {
  const res = await API.get(`/${id}`)
  return res.data
}

export const approveTask = async (id) => {
  const res = await API.post(`/${id}/approve`)
  return res.data
}

export const rejectTask = async (id) => {
  const res = await API.post(`/${id}/reject`)
  return res.data
}

export const completeTask = async (id) => {
  const res = await API.post(`/${id}/complete`)
  return res.data
}

export const addComment = async (id, message) => {
  const res = await API.post(`/${id}/comments`, { message })
  return res.data
}

export const addAttachment = async (id, payload) => {
  const res = await API.post(`/${id}/attachments`, payload)
  return res.data
}

export default { createTask, listTasks, getTask, approveTask, rejectTask, completeTask, addComment, addAttachment }
