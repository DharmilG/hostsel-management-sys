import { useEffect, useState } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import LeaveRequestForm from "../../components/LeaveRequestForm"
import AttachmentViewer from "../../components/AttachmentViewer"
import { createLeaveRequest, getMyLeaveRequests, cancelRequest } from "../../api/staffLeaveApi"
import { Plus, Clock, Check, X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-600" },
  approved: { label: "Approved", color: "text-emerald-600" },
  denied: { label: "Denied", color: "text-red-600" },
  cancelled: { label: "Cancelled", color: "text-slate-500" }
}

const LEAVE_TYPE_LABEL = {
  sick: "Sick Leave",
  personal: "Personal Leave",
  short: "Short Leave",
  emergency: "Emergency",
  unpaid: "Unpaid Leave"
}

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—"

// ─── Single Request Row/Card ────────────────────────────────────────────────
const RequestCard = ({ r, onCancel }) => {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending

  let attachments = []
  try {
    attachments = typeof r.attachments === "string"
      ? JSON.parse(r.attachments)
      : (r.attachments || [])
  } catch { attachments = [] }

  const hasAttachments = attachments.length > 0

  return (
    <div className="bg-white/70 border border-slate-100 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">{LEAVE_TYPE_LABEL[r.leave_type] || r.leave_type}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <div>
                <span className="text-xs text-slate-400">From</span>
                <p className="text-sm text-slate-700">{fmtDate(r.start_time)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">To</span>
                <p className="text-sm text-slate-700">{fmtDate(r.end_time)}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 flex-shrink-0">{fmtDate(r.created_at)}</p>
        </div>

        {r.reason && (
          <p className="mt-3 text-sm text-slate-600 line-clamp-2">{r.reason}</p>
        )}

        {/* Admin comment */}
        {r.admin_comment && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Admin Note</p>
            <p className="text-sm text-slate-700">{r.admin_comment}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center gap-3">
          {hasAttachments && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {attachments.length} Attachment{attachments.length !== 1 ? "s" : ""}
            </button>
          )}

          <div className="ml-auto">
            {r.status === "pending" && (
              <Button variant="danger" size="sm" onClick={() => onCancel(r.id)}>
                <X className="w-3.5 h-3.5" /> Cancel Request
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded attachments */}
      {hasAttachments && expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-5 pt-4">
          <AttachmentViewer attachments={attachments} title="Your Attachments" />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const LeaveRequests = () => {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchRequests = async () => {
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

  useEffect(() => { fetchRequests() }, [])

  const handleCreate = async (payload) => {
    try {
      const res = await createLeaveRequest(payload)
      setRequests((prev) => [res.data, ...prev])
      setOpen(false)
      showToast("Leave request submitted successfully!")
    } catch (err) {
      console.error("Failed to create leave request", err)
      showToast(err?.message || "Failed to submit request. Please try again.", "error")
    }
  }

  const handleCancel = async (id) => {
    if (!confirm("Cancel this leave request?")) return
    try {
      const res = await cancelRequest(id)
      setRequests((prev) => prev.map((r) => (r.id === id ? res.data : r)))
      showToast("Request cancelled")
    } catch (err) {
      console.error(err)
      showToast("Failed to cancel request", "error")
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in-up
          ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">My Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pendingCount > 0
              ? <><span className="text-amber-600 font-medium">{pendingCount} request{pendingCount !== 1 ? "s" : ""}</span> awaiting admin review</>
              : "Submit and track your leave requests"
            }
          </p>
        </div>
        <Button onClick={() => setOpen(true)} variant="primary">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
          <Clock className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No leave requests yet</p>
          <p className="text-sm text-slate-400 mt-1">Click "New Request" to submit your first leave request</p>
        </div>
      )}

      {/* Request list */}
      {!loading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => (
            <RequestCard key={r.id} r={r} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="New Leave Request"
        maxWidthClass="max-w-xl"
      >
        <LeaveRequestForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
      </Modal>
    </DashboardLayout>
  )
}

export default LeaveRequests
