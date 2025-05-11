import { useEffect, useState } from "react"
import { Wrench, CheckCircle2 } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import { useAuth } from "../../context/AuthContext"
import { getAllTickets, updateTicket } from "../../api/maintenanceApi"
import { getFileUrl } from "../../api/uploadApi"
import { getAllStaff } from "../../api/userApi"

const PRIORITY_META = {
  low:    { dotClass: "bg-indigo-500", badgeBg: "bg-indigo-50",  badgeText: "text-indigo-600" },
  medium: { dotClass: "bg-amber-500",  badgeBg: "bg-amber-50",   badgeText: "text-amber-600"  },
  high:   { dotClass: "bg-orange-400", badgeBg: "bg-orange-50",  badgeText: "text-orange-600" },
  urgent: { dotClass: "bg-rose-600",   badgeBg: "bg-rose-50",    badgeText: "text-rose-600"   }
}

const STATUS_META = {
  open:        { badgeBg: "bg-slate-100",  badgeText: "text-slate-600"   },
  in_progress: { badgeBg: "bg-sky-50",     badgeText: "text-sky-700"     },
  resolved:    { badgeBg: "bg-emerald-50", badgeText: "text-emerald-700" },
  closed:      { badgeBg: "bg-slate-100",  badgeText: "text-slate-400"   }
}

const statusLabel = (s) => s?.replace("_", " ") || s

const AdminMaintenance = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState("")
  const [modalPriority, setModalPriority] = useState("")
  const [modalAssigned, setModalAssigned] = useState("")
  const [modalNotes, setModalNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [filterStatus, setFilterStatus] = useState("")

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllTickets(filterStatus ? { status: filterStatus } : {})
        setTickets(res.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [filterStatus])

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await getAllStaff()
        setStaffList(res.data || [])
      } catch (e) {
        console.error(e)
        setStaffList([])
      }
    }
    fetchStaff()
  }, [])

  const openModal = (t) => {
    setSelected(t)
    setModalStatus(t.status)
    setModalPriority(t.priority)
    setModalAssigned(t.assigned_to || "")
    setModalNotes(t.resolution_notes || "")
    setIsModalOpen(true)
  }

  const handleResolve = async (id) => {
    try {
      const res = await updateTicket(id, { status: "resolved" })
      setTickets((prev) => prev.map((t) => (t.id === id ? res.data : t)))
    } catch (err) {
      console.error(err)
      alert("Failed to resolve ticket.")
    }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const patch = {
        status: modalStatus,
        priority: modalPriority,
        resolution_notes: modalNotes
      }
      if (modalAssigned !== "") patch.assigned_to = modalAssigned || null
      const res = await updateTicket(selected.id, patch)
      setTickets((prev) => prev.map((t) => (t.id === selected.id ? res.data : t)))
      setIsModalOpen(false)
      setSelected(null)
    } catch (err) {
      console.error(err)
      alert("Failed to update ticket.")
    } finally {
      setSaving(false)
    }
  }

  const filteredTickets = tickets

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">Maintenance Tickets</h1>
        </div>
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 bg-white/80 text-slate-700 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Title</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Reported by</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Priority</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Status</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Assigned</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-slate-500">Loading tickets...</td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-slate-500">No tickets found.</td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const pMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium
                const sMeta = STATUS_META[t.status] || STATUS_META.open
                const reporter = t.raised_student_name || t.raised_user_name || t.raised_student_email || t.raised_user_email || "—"

                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 hover:bg-white/50 transition-colors cursor-pointer"
                    onClick={(e) => { if (e.target.closest("button")) return; openModal(t) }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{t.title}</div>
                      {t.location && <div className="text-xs text-slate-400">{t.location}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{reporter}</td>
                    <td className="px-6 py-4">
                      <span className={`${pMeta.badgeBg} ${pMeta.badgeText} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold`}>
                        <span className={`w-2 h-2 rounded-full ${pMeta.dotClass}`} />
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${sMeta.badgeBg} ${sMeta.badgeText} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">
                      {t.assigned_username || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {t.status !== "resolved" && t.status !== "closed" && (
                        <Button variant="primary" size="sm" onClick={() => handleResolve(t.id)}>
                          <CheckCircle2 className="w-4 h-4" />
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelected(null) }}
        title={selected ? `Ticket #${selected.id}` : "Ticket Details"}
        maxWidthClass="max-w-2xl"
        overlayClassName="bg-black/50 backdrop-blur-sm"
        contentClassName="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl shadow-sm p-6"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); setSelected(null) }} size="sm">Cancel</Button>
            <Button variant="primary" onClick={handleSave} size="md" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-slate-700">Title</div>
              <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 text-slate-900 text-lg font-semibold">
                {selected.title}
              </div>
            </div>

            {selected.description && (
              <div>
                <div className="text-sm font-medium text-slate-700">Description</div>
                <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 text-slate-800 whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {selected.description}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-slate-700">Reported by</div>
                <div className="mt-1 text-slate-900">
                  {selected.raised_student_name || selected.raised_user_name || "—"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Category / Location</div>
                <div className="mt-1 text-slate-900">
                  {selected.category}{selected.location ? ` — ${selected.location}` : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-slate-700">Status</div>
                <select value={modalStatus} onChange={(e) => setModalStatus(e.target.value)}
                  className="mt-2 w-full p-2 rounded-xl border border-slate-200 bg-white/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-200">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Priority</div>
                <select value={modalPriority} onChange={(e) => setModalPriority(e.target.value)}
                  className="mt-2 w-full p-2 rounded-xl border border-slate-200 bg-white/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-200">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Assign to staff */}
            <div>
              <div className="text-sm font-medium text-slate-700">Assign to Staff</div>
              <select value={modalAssigned} onChange={(e) => setModalAssigned(e.target.value)}
                className="mt-2 w-full p-2 rounded-xl border border-slate-200 bg-white/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-200">
                <option value="">— Unassigned —</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.username} ({s.email})</option>
                ))}
              </select>
            </div>

            {/* Resolution notes */}
            <div>
              <div className="text-sm font-medium text-slate-700">Resolution Notes</div>
              <textarea value={modalNotes} onChange={(e) => setModalNotes(e.target.value)}
                rows={3} className="mt-2 w-full p-3 rounded-xl border border-slate-200 bg-white/90"
                placeholder="Add resolution notes (optional)" />
            </div>

            {/* Photo thumbnails */}
            {(() => {
              let photos = []
              try { photos = typeof selected.photos === "string" ? JSON.parse(selected.photos) : (selected.photos || []) } catch {}
              if (photos.length === 0) return null
              return (
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">Attached Photos</div>
                  <div className="flex gap-2 flex-wrap">
                    {photos.map((p, i) => (
                      <a key={i} href={getFileUrl(p.file_ref)} target="_blank" rel="noopener noreferrer">
                        <img src={getFileUrl(p.file_ref)} alt={p.original_name}
                          className="w-20 h-20 object-cover rounded-xl border border-slate-100 hover:opacity-90 transition-opacity"
                          onError={(e) => { e.currentTarget.style.display = "none" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default AdminMaintenance
