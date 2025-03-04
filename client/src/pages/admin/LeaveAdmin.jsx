import { useEffect, useState } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import Button from "../../components/Button"
import { getPendingRequests, approveRequest, denyRequest } from "../../api/staffLeaveApi"
import { Check, X } from "lucide-react"

const LeaveAdmin = () => {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getPendingRequests()
      setPending(res.data || [])
    } catch (err) {
      console.error(err)
      setPending([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  const handleApprove = async (id) => {
    const comment = prompt("Optional approval note:")
    if (!confirm("Approve this request?")) return
    try {
      const res = await approveRequest(id, { admin_comment: comment })
      setPending((p) => p.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
      alert("Failed to approve")
    }
  }

  const handleDeny = async (id) => {
    const comment = prompt("Reason for denial (optional):")
    if (!confirm("Deny this request?")) return
    try {
      const res = await denyRequest(id, { admin_comment: comment })
      setPending((p) => p.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
      alert("Failed to deny")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Leave Requests — Pending</h1>
          <div className="text-sm text-slate-600">Approve or deny staff leave requests</div>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-600">Loading...</div>}

      <div className="space-y-4">
        {pending.map((r) => (
          <div key={r.id} className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-600">{r.staff_username || r.staff_email}</div>
                <div className="text-lg font-semibold text-slate-900">{r.leave_type} — {new Date(r.start_time).toLocaleString()} to {new Date(r.end_time).toLocaleString()}</div>
                {r.reason && <div className="mt-2 text-slate-700">{r.reason}</div>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-slate-600">Requested</div>
                <div className="text-slate-900">{new Date(r.created_at).toLocaleString()}</div>
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" onClick={() => handleApprove(r.id)}><Check className="w-4 h-4" /> Approve</Button>
                  <Button variant="danger" onClick={() => handleDeny(r.id)}><X className="w-4 h-4" /> Deny</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

export default LeaveAdmin
