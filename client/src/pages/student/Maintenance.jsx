import { useEffect, useState } from "react"
import { Wrench, PlusCircle } from "lucide-react"
import Button from "../../components/Button"
import DashboardLayout from "../../components/DashboardLayout"
import { useAuth } from "../../context/AuthContext"
import { createTicket, getMyTickets } from "../../api/maintenanceApi"
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
  open:        { badgeBg: "bg-slate-100",    badgeText: "text-slate-600"   },
  in_progress: { badgeBg: "bg-sky-50",       badgeText: "text-sky-700"     },
  resolved:    { badgeBg: "bg-emerald-50",   badgeText: "text-emerald-700" },
  closed:      { badgeBg: "bg-slate-100",    badgeText: "text-slate-400"   }
}

const statusLabel = (s) => s?.replace("_", " ") || s

const CATEGORIES = ["general", "plumbing", "electrical", "carpentry", "cleaning", "furniture", "other"]

const StudentMaintenance = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("general")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [priority, setPriority] = useState("medium")
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    const fetch = async () => {
      if (!user) return
      try {
        const res = await getMyTickets()
        setTickets(res.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const resetForm = () => {
    setTitle("")
    setCategory("general")
    setDescription("")
    setLocation("")
    setPriority("medium")
    setPhotos([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return alert("Please enter a title for the ticket.")
    setSubmitting(true)
    try {
      const res = await createTicket({ title, category, description, location, priority, photos })
      const created = res.data
      setTickets((prev) => [created, ...prev])
      resetForm()
    } catch (err) {
      console.error(err)
      alert("Failed to submit ticket. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Wrench className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">Maintenance Requests</h1>
      </div>

      {/* Submit form */}
      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
              placeholder="e.g. Leaking tap in bathroom"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
              placeholder="e.g. Room 204, Block A"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Priority</label>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {PRIORITY_LABELS.map((p) => {
                const meta = PRIORITY_META[p.value]
                const active = priority === p.value
                const cls = active
                  ? `${meta.dot} text-white px-3 py-1.5`
                  : `${meta.badgeBg} ${meta.badgeText} px-3 py-1.5`
                return (
                  <Button
                    key={p.value}
                    type="button"
                    variant="none"
                    size="sm"
                    onClick={() => setPriority(p.value)}
                    className={`rounded-full text-sm font-medium transition-all border ${cls}`}
                  >
                    {p.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
              placeholder="Describe the issue in detail"
            />
          </div>

          <div className="md:col-span-2">
            <FileUpload
              label="Photos"
              helpText="Attach photos of the issue (optional)"
              value={photos}
              onChange={setPhotos}
              accept="image/*,application/pdf"
              maxFiles={5}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <Button type="submit" variant="primary" disabled={submitting}>
              <PlusCircle className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>

      {/* Ticket list */}
      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Your tickets</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-500">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-slate-500">No tickets yet.</div>
          ) : (
            tickets.map((t) => {
              const pMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium
              const sMeta = STATUS_META[t.status] || STATUS_META.open
              let photos = []
              try { photos = typeof t.photos === "string" ? JSON.parse(t.photos) : (t.photos || []) } catch {}

              return (
                <div key={t.id} className="border border-slate-100 p-4 rounded-xl bg-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-slate-800 font-medium">{t.title}</div>
                      <div className="text-xs text-slate-500">
                        {t.category} • {t.location && `${t.location} • `}{new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className={`${sMeta.badgeBg} ${sMeta.badgeText} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize`}>
                      {statusLabel(t.status)}
                    </span>
                  </div>

                  {t.description && (
                    <div className="mt-3 text-slate-700 text-sm">{t.description}</div>
                  )}

                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <span className={`${pMeta.badgeBg} ${pMeta.badgeText} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold`}>
                      <span className={`w-2 h-2 rounded-full ${pMeta.dot}`} />
                      {t.priority}
                    </span>
                    {t.assigned_username && (
                      <span className="text-xs text-slate-500">Assigned to: {t.assigned_username}</span>
                    )}
                  </div>

                  {/* Photo thumbnails */}
                  {photos.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {photos.map((p, i) => (
                        <a key={i} href={getFileUrl(p.file_ref)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getFileUrl(p.file_ref)}
                            alt={p.original_name}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-100"
                            onError={(e) => { e.currentTarget.style.display = "none" }}
                          />
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
    </DashboardLayout>
  )
}

export default StudentMaintenance
