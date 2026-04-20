import { useEffect, useState } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import LeaveRequestForm from "../../components/LeaveRequestForm"
import { createLeaveRequest, getMyLeaveRequests, cancelRequest } from "../../api/staffLeaveApi"
import { X, Plus } from "lucide-react"

const LeaveRequests = () => {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getMyLeaveRequests()
      setRequests(res.data || [])
    } catch (err) {
      console.error("Failed to load leave requests", err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  const handleCreate = async (payload) => {
    try {
      const res = await createLeaveRequest(payload)
      setRequests((p) => [res.data, ...p])
      setOpen(false)
    } catch (err) {
      console.error("Failed to create leave request", err)
      alert("Failed to submit request. Please try again.")
    }
  }

  const handleCancel = async (id) => {
    if (!confirm("Cancel this leave request?")) return
    try {
      const res = await cancelRequest(id)
      setRequests((p) => p.map((r) => (r.id === id ? res.data : r)))
    } catch (err) {
      console.error(err)
      alert("Failed to cancel request")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-800">My Leave Requests</h1>
        </div>

        <Button onClick={() => setOpen(true)} variant="primary">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <div className="space-y-4">
        {loading && <div className="text-sm text-slate-600">Loading...</div>}
        {!loading && requests.length === 0 && <div className="text-sm text-slate-600">No requests yet.</div>}

        {requests.map((r) => (
          <div key={r.id} className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-600">{r.leave_type}</div>
                <div className="text-lg font-semibold text-slate-900">{new Date(r.start_time).toLocaleString()} — {new Date(r.end_time).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">Status</div>
                <div className="mt-1 font-semibold text-slate-900">{r.status}</div>
              </div>
            </div>

            {r.reason && <p className="mt-3 text-slate-700">{r.reason}</p>}

            {r.attachments?.length > 0 && (
              <div className="mt-3 text-sm text-slate-600">
                Attachments:
                <ul className="list-disc pl-5">
                  {r.attachments.map((a, idx) => (
                    <li key={idx}>{a.name || a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {r.status === "pending" && (
                <Button variant="danger" onClick={() => handleCancel(r.id)}>Cancel</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Leave Request">
        <LeaveRequestForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
      </Modal>
    </DashboardLayout>
  )
}

export default LeaveRequests
