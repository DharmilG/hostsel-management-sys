import { useEffect, useState } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import ShiftCard from "../../components/ShiftCard"
import ShiftForm from "../../components/ShiftForm"
import Button from "../../components/Button"
import createAPI from "../../api/fetchClient"
import { useAuth } from "../../context/AuthContext"

const api = createAPI()

const ShiftRoster = () => {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const res = await api.get(`/shifts?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      setShifts(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const handleCreate = async (payload) => {
    try {
      await api.post(`/shifts`, payload)
      setShowCreate(false)
      fetchShifts()
    } catch (e) {
      console.error(e)
      alert(e.message || 'Failed to create shift')
    }
  }

  const handleAssign = async (shift) => {
    try {
      await api.post(`/shifts/${shift.id}/assign`, {})
      fetchShifts()
    } catch (e) {
      console.error(e)
      alert('Failed to assign')
    }
  }

  const handleUnassign = async (shift) => {
    try {
      await api.post(`/shifts/${shift.id}/unassign`)
      fetchShifts()
    } catch (e) {
      console.error(e)
      alert('Failed to unassign')
    }
  }

  const handleExport = async () => {
    try {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const res = await api.get(`/shifts/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      const blob = new Blob([res.data], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'shifts.ics'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Failed to export calendar')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Shift Roster</h1>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowCreate(true)}>Create shift</Button>
          <Button variant="export" onClick={handleExport}>Export (.ics)</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : shifts.length ? (
          shifts.map((s) => (
            <ShiftCard key={`${s.id}-${s.assignment_id || 'na'}`} shift={s} onAssign={handleAssign} onUnassign={handleUnassign} isAdmin={user?.role === 'admin'} />
          ))
        ) : (
          <div className="text-slate-500">No shifts found for the selected range.</div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create shift">
        <ShiftForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>
    </DashboardLayout>
  )
}

export default ShiftRoster
