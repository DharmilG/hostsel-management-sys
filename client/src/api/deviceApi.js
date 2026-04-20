import { createAPI } from './fetchClient'

const API = createAPI('/api/devices')

export const registerDevice = async (data) => {
  const res = await API.post('/', data)
  return res.data
}

export const getDevices = async () => {
  const res = await API.get('/')
  return res.data
}

export const getDeviceLogs = async (id) => {
  const res = await API.get(`/${id}/logs`)
  return res.data
}

export default { registerDevice, getDevices, getDeviceLogs }
