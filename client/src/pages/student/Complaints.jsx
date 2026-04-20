import { useEffect, useState } from "react"
import { ClipboardList, PlusCircle } from "lucide-react"
import Button from "../../components/Button"
import DashboardLayout from "../../components/DashboardLayout"
import { useAuth } from "../../context/AuthContext"
import { createComplaint, getComplaintsByStudent } from "../../api/complaintApi"

const severityLabels = [
  { value: 1, label: "Low" },
  { value: 2, label: "Minor" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Major" },
  { value: 5, label: "Critical" }
]

// Severity color presets (kept local to this JSX file as requested)
// Updated single-color palette to better match app theme and avoid gradients.
const severityPresetFor = (raw) => {
  const sev = Number(raw) || 0
  const label = severityLabels.find((s) => s.value === sev)?.label || 'Unknown'
  switch (sev) {
    case 1:
      return { dot: 'bg-indigo-500', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600', label }
    case 2:
      return { dot: 'bg-sky-400', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', label }
    case 3:
      return { dot: 'bg-amber-500', badgeBg: 'bg-amber-50', badgeText: 'text-amber-600', label }
    case 4:
      return { dot: 'bg-orange-400', badgeBg: 'bg-orange-50', badgeText: 'text-orange-600', label }
    case 5:
    default:
      return { dot: 'bg-rose-600', badgeBg: 'bg-rose-50', badgeText: 'text-rose-600', label }
  }
}

const Complaints = () => {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Hostel")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState(3)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!user) return
      try {
        const res = await getComplaintsByStudent(user.id)
        setComplaints(res.data || [])
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
    setCategory("Hostel")
    setDescription("")
    setSeverity(3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      return alert("Please enter title and description for the complaint.")
    }
    if (!user) return alert("You must be logged in to submit a complaint.")

    setSubmitting(true)
    try {
      const payload = {
        title,
        description,
        category,
        severity,
        status: "pending"
      }
      const res = await createComplaint(payload)
      const created = res.data
      setComplaints((prev) => [created, ...prev])
      resetForm()
    } catch (err) {
      console.error(err)
      alert("Failed to submit complaint. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">Complaints</h1>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
              placeholder="Short summary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
            >
              <option>Hostel</option>
              <option>Mess</option>
              <option>Maintenance</option>
              <option>Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-2 w-full p-3 rounded-xl border border-slate-100 bg-white/50"
              placeholder="Describe the issue in detail"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Severity</label>
            <div className="mt-2 flex items-center gap-2">
              {severityLabels.map((s) => {
                const meta = severityPresetFor(s.value)
                const active = severity === s.value
                const stateCls = active
                  ? `${meta.dot} text-white px-3 py-1.5`
                  : `${meta.badgeBg} ${meta.badgeText} px-3 py-1.5`

                return (
                  <Button
                    key={s.value}
                    type="button"
                    variant="none"
                    size="sm"
                    onClick={() => setSeverity(s.value)}
                    className={`rounded-full text-sm font-medium transition-all border ${stateCls}`}
                  >
                    {s.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <Button type="submit" variant="primary" disabled={submitting}>
              <PlusCircle className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Your complaints</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-500">Loading...</div>
          ) : complaints.length === 0 ? (
            <div className="text-slate-500">No complaints yet.</div>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="border border-slate-100 p-4 rounded-xl bg-white/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-slate-800 font-medium">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.category} • {new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm font-medium text-slate-700">{c.status}</div>
                </div>
                <div className="mt-3 text-slate-700">{c.description}</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="text-sm text-slate-500">Severity:</div>
                  {(() => {
                    const meta = severityPresetFor(c.severity)
                    return (
                      <>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full ${i < c.severity ? meta.dot : 'bg-slate-200'}`} />
                          ))}
                        </div>
                        <span className={`${meta.badgeBg} ${meta.badgeText} ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold`}>{meta.label}</span>
                      </>
                    )
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Complaints
