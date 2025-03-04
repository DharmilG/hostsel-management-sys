import { createAPI } from './fetchClient'

const API = createAPI('/api/clock')

export const clock = async (data) => {
  const res = await API.post('/', data)
  return res.data
}

export const clockBatch = async (events) => {
  const res = await API.post('/batch', events)
  return res.data
}

export const getTimesheet = async (params) => {
  const qs = new URLSearchParams(params || {}).toString()
  const res = await API.get(`/timesheets?${qs}`)
  return res.data
}

export const exportPayroll = async (params) => {
  const qs = new URLSearchParams(params || {}).toString()
  const res = await API.get(`/payroll/export?${qs}`)
  return res
}

export default { clock, clockBatch, getTimesheet, exportPayroll }
