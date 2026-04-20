import { useEffect, useState, useCallback } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import Button from "../../components/Button"
import Modal from "../../components/Modal"
import AttachmentViewer from "../../components/AttachmentViewer"
import { getPendingRequests, getAllLeaveRequests, approveRequest, denyRequest } from "../../api/staffLeaveApi"
import { Check, X, Clock, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Filter } from "lucide-react"

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

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

// ─── Confirmation / Comment Modal ─────────────────────────────────────────────
const ActionModal = ({ isOpen, onClose, action, onConfirm }) => {
  const [comment, setComment] = useState("")
  const isApprove = action === "approve"

  useEffect(() => { if (!isOpen) setComment("") }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? "Approve Leave Request" : "Deny Leave Request"}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {isApprove
            ? "Add an optional note for the staff member."
            : "Please provide a reason for denial (visible to staff)."}
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={isApprove ? "Optional approval note…" : "Reason for denial…"}
          className="w-full bg-white/60 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--button-black)]/20 focus:border-[color:var(--button-black)] transition-colors text-slate-800 resize-none text-sm"
        />
        <div className="flex gap-3">
          <Button
            variant={isApprove ? "primary" : "danger"}
            onClick={() => { onConfirm(comment); onClose() }}
          >
            {isApprove ? <><Check className="w-4 h-4" /> Approve</> : <><X className="w-4 h-4" /> Deny</>}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Individual Leave Request Card ────────────────────────────────────────────
const LeaveRequestCard = ({ r, onApprove, onDeny }) => {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
  const hasAttachments = Array.isArray(r.attachments) && r.attachments.length > 0

  // Normalise attachments — stored as JSON in DB; may be stringified
  let attachments = []
  try {
    attachments = typeof r.attachments === "string"
      ? JSON.parse(r.attachments)
      : (r.attachments || [])
  } catch {
    attachments = []
  }

  return (
    <div className="bg-white/70 border border-slate-100 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Card header */}
      <div className="flex items-start gap-4 p-6">
        {/* Avatar-like initial */}
        <div className="w-10 h-10 rounded-2xl bg-[color:var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[color:var(--color-primary)]">
            {(r.staff_username || r.staff_email || "?")[0].toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900">{r.staff_username || r.staff_email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{r.staff_email}</p>
            </div>
            <p className="text-xs text-slate-400 flex-shrink-0 mt-1">
              {fmtDate(r.created_at)}
            </p>
          </div>

          {/* Leave type + dates */}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Type</span>
              <p className="text-sm font-medium text-slate-800">{LEAVE_TYPE_LABEL[r.leave_type] || r.leave_type}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">From</span>
              <p className="text-sm font-medium text-slate-800">{fmtDate(r.start_time)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">To</span>
              <p className="text-sm font-medium text-slate-800">{fmtDate(r.end_time)}</p>
            </div>
            {r.partial && (
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Duration</span>
                <p className="text-sm font-medium text-slate-800">Partial day</p>
              </div>
            )}
          </div>

          {/* Reason preview */}
          {r.reason && (
            <p className="mt-3 text-sm text-slate-700 line-clamp-2">{r.reason}</p>
          )}

          {/* Admin comment (shown when denied/approved) */}
          {r.admin_comment && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Admin Note</p>
              <p className="text-sm text-slate-700">{r.admin_comment}</p>
            </div>
          )}

          {/* Footer row — attachment badge + expand + actions */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {/* Attachment count badge */}
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

            {/* View full reason if truncated */}
            {r.reason && r.reason.length > 100 && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-xs text-[color:var(--color-primary)] hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}

            <div className="ml-auto flex gap-2">
              {r.status === "pending" && (
                <>
                  <Button variant="primary" size="sm" onClick={() => onApprove(r.id)}>
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDeny(r.id)}>
                    <X className="w-3.5 h-3.5" /> Deny
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded section — full reason + attachments */}
      {expanded && (
        <div className="border-t border-slate-100 px-6 pb-6 pt-4 bg-slate-50/50 space-y-4">
          {r.reason && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Reason</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{r.reason}</p>
            </div>
          )}

          {/* Attachments with preview + download */}
          {hasAttachments && attachments.length > 0 && (
            <AttachmentViewer attachments={attachments} title="Supporting Documents" />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main LeaveAdmin Page ─────────────────────────────────────────────────────
const LeaveAdmin = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("pending")
  const [actionModal, setActionModal] = useState({ open: false, id: null, action: null })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = filter === "pending" ? await getPendingRequests() : await getAllLeaveRequests()
      setRequests(res.data || [])
    } catch (err) {
      console.error(err)
      setRequests([])
      showToast("Failed to load leave requests", "error")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const openApprove = (id) => setActionModal({ open: true, id, action: "approve" })
  const openDeny = (id) => setActionModal({ open: true, id, action: "deny" })

  const handleConfirmAction = async (comment) => {
    const { id, action } = actionModal
    try {
      if (action === "approve") {
        await approveRequest(id, { admin_comment: comment })
        showToast("Request approved successfully")
      } else {
        await denyRequest(id, { admin_comment: comment })
        showToast("Request denied")
      }
      // Refresh list
      await fetchRequests()
    } catch (err) {
      console.error(err)
      showToast(`Failed to ${action} request`, "error")
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length

  const displayedRequests = filter === "all"
    ? requests
    : requests.filter((r) => r.status === filter)

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review, approve or deny staff leave requests
            {pendingCount > 0 && filter !== "all" && (
              <span className="ml-2 text-amber-600 font-medium">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "denied", label: "Denied" },
          { value: "all", label: "All Requests" }
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
          <Clock className="w-4 h-4 animate-spin" /> Loading requests…
        </div>
      )}

      {!loading && displayedRequests.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No {filter !== "all" ? filter : ""} requests</p>
          <p className="text-sm text-slate-400 mt-1">All caught up!</p>
        </div>
      )}

      <div className="space-y-4">
        {displayedRequests.map((r) => (
          <LeaveRequestCard
            key={r.id}
            r={r}
            onApprove={openApprove}
            onDeny={openDeny}
          />
        ))}
      </div>

      {/* Confirm action modal */}
      <ActionModal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, id: null, action: null })}
        action={actionModal.action}
        onConfirm={handleConfirmAction}
      />
    </DashboardLayout>
  )
}

export default LeaveAdmin
