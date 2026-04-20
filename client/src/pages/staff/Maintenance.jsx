import { useEffect, useState } from "react"
import { Wrench, PlusCircle } from "lucide-react"
import Button from "../../components/Button"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import { useAuth } from "../../context/AuthContext"
import { createTicket, getMyTickets, getAssignedTickets, updateMyTicketStatus } from "../../api/maintenanceApi"
import { getFileUrl } from "../../api/uploadApi"
import FileUpload from "../../components/FileUpload"

const PRIORITY_LABELS = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" }
]

const PRIORITY_META = {
  low:    { dot: "bg-indigo-500", badgeBg: "bg-indigo-50",  badgeText: "text-indigo-600" },
  medium: { dot: "bg-amber-500",  badgeBg: "bg-amber-50",   badgeText: "text-amber-600"  },
  high:   { dot: "bg-orange-400", badgeBg: "bg-orange-50",  badgeText: "text-orange-600" },
  urgent: { dot: "bg-rose-600",   badgeBg: "bg-rose-50",    badgeText: "text-rose-600"   }
}

const STATUS_META = {
  open:        { badgeBg: "bg-slate-100",  badgeText: "text-slate-600"   },
  in_progress: { badgeBg: "bg-sky-50",     badgeText: "text-sky-700"     },
  resolved:    { badgeBg: "bg-emerald-50", badgeText: "text-emerald-700" },
  closed:      { badgeBg: "bg-slate-100",  badgeText: "text-slate-400"   }
}

const statusLabel = (s) => s?.replace("_", " ") || s
const CATEGORIES = ["general", "plumbing", "electrical", "carpentry", "cleaning", "furniture", "other"]

const StaffMaintenance = () => {
  const { user } = useAuth()

  // Tabs: "mine" (created by me) | "assigned" (assigned to me)
  const [tab, setTab] = useState("assigned")
  const [myTickets, setMyTickets] = useState([])
  const [assignedTickets, setAssignedTickets] = useState([])
  const [loading, setLoading] = useState(true)

  // New ticket form
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("general")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [priority, setPriority] = useState("medium")
  const [photos, setPhotos] = useState([])

  // Status update modal
  const [selected, setSelected] = useState(null)
  const [modalStatus, setModalStatus] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mine, assigned] = await Promise.all([getMyTickets(), getAssignedTickets()])
      setMyTickets(mine.data || [])
      setAssignedTickets(assigned.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [user])

  const resetForm = () => {
    setTitle(""); setCategory("general"); setDescription("")
    setLocation(""); setPriority("medium"); setPhotos([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return alert("Please enter a title.")
    setSubmitting(true)
    try {
      const res = await createTicket({ title, category, description, location, priority, photos })
      setMyTickets((prev) => [res.data, ...prev])
      resetForm()
      setShowForm(false)
      setTab("mine")
    } catch (err) {
      console.error(err)
      alert("Failed to submit. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const openStatusModal = (t) => {
    setSelected(t)
    setModalStatus(t.status === "open" ? "in_progress" : t.status)
    setResolutionNotes(t.resolution_notes || "")
  }

  const handleSaveStatus = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await updateMyTicketStatus(selected.id, { status: modalStatus, resolution_notes: resolutionNotes })
      await fetchAll()
      setSelected(null)
    } catch (err) {
      console.error(err)
      alert("Failed to update status.")
    } finally {
      setSaving(false)
    }
  }

  const displayTickets = tab === "assigned" ? assignedTickets : myTickets

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">Maintenance</h1>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          <PlusCircle className="w-4 h-4" />
          {showForm ? "Cancel" : "New Ticket"}
        </Button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
                placeholder="e.g. Broken window in corridor" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
                placeholder="e.g. Block B, Floor 2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {PRIORITY_LABELS.map((p) => {
                  const meta = PRIORITY_META[p.value]
                  const active = priority === p.value
                  const cls = active ? `${meta.dot} text-white px-3 py-1.5` : `${meta.badgeBg} ${meta.badgeText} px-3 py-1.5`
                  return (
                    <Button key={p.value} type="button" variant="none" size="sm"
                      onClick={() => setPriority(p.value)}
                      className={`rounded-full text-sm font-medium transition-all border ${cls}`}>
                      {p.label}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
                placeholder="Describe the issue" />
            </div>
            <div className="md:col-span-2">
              <FileUpload label="Photos" helpText="Attach photos (optional)" value={photos}
                onChange={setPhotos} accept="image/*,application/pdf" maxFiles={5} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" variant="primary" disabled={submitting}>
                <PlusCircle className="w-4 h-4" />
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "assigned", label: `Assigned to me (${assignedTickets.length})` },
          { key: "mine",     label: `Raised by me (${myTickets.length})` }
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-500">Loading...</div>
          ) : displayTickets.length === 0 ? (
            <div className="text-slate-500">No tickets.</div>
          ) : (
            displayTickets.map((t) => {
              const pMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium
              const sMeta = STATUS_META[t.status] || STATUS_META.open
              let tPhotos = []
              try { tPhotos = typeof t.photos === "string" ? JSON.parse(t.photos) : (t.photos || []) } catch {}

              return (
                <div key={t.id} className="border border-slate-100 p-4 rounded-xl bg-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-slate-800 font-medium">{t.title}</div>
                      <div className="text-xs text-slate-500">
                        {t.category} {t.location && `• ${t.location}`} • {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${sMeta.badgeBg} ${sMeta.badgeText} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize`}>
                        {statusLabel(t.status)}
                      </span>
                      {tab === "assigned" && t.status !== "resolved" && t.status !== "closed" && (
                        <Button variant="primary" size="sm" onClick={() => openStatusModal(t)}>
                          Update
                        </Button>
                      )}
                    </div>
                  </div>

                  {t.description && <div className="mt-3 text-sm text-slate-700">{t.description}</div>}

                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <span className={`${pMeta.badgeBg} ${pMeta.badgeText} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold`}>
                      <span className={`w-2 h-2 rounded-full ${pMeta.dot}`} />
                      {t.priority}
                    </span>
                    {(t.raised_student_name || t.raised_user_name) && (
                      <span className="text-xs text-slate-500">
                        Reported by: {t.raised_student_name || t.raised_user_name}
                      </span>
                    )}
                  </div>

                  {tPhotos.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {tPhotos.map((p, i) => (
                        <a key={i} href={getFileUrl(p.file_ref)} target="_blank" rel="noopener noreferrer">
                          <img src={getFileUrl(p.file_ref)} alt={p.original_name}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-100"
                            onError={(e) => { e.currentTarget.style.display = "none" }} />
                        </a>
                      ))}
                    </div>
                  )}

                  {t.resolution_notes && (
                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                      <div className="text-xs text-slate-400 mb-0.5">Resolution note</div>
                      <div className="text-sm text-slate-700">{t.resolution_notes}</div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Status update modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)}
        title={selected ? `Update Ticket — ${selected.title}` : ""}
        maxWidthClass="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelected(null)} size="sm">Cancel</Button>
            <Button variant="primary" onClick={handleSaveStatus} size="md" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700">Status</div>
              <select value={modalStatus} onChange={(e) => setModalStatus(e.target.value)}
                className="mt-2 w-full p-3 rounded-xl border border-slate-200 bg-white/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-200">
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Resolution Notes</div>
              <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3} className="mt-2 w-full p-3 rounded-xl border border-slate-200 bg-white/90"
                placeholder="Describe what was done (optional)" />
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default StaffMaintenance
