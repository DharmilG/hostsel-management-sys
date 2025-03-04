import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import { useAuth } from "../../context/AuthContext"
import { getAllComplaints, updateComplaintStatus } from "../../api/complaintApi"
import { getStudentById } from "../../api/studentApi"

const Complaints = () => {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [studentInfo, setStudentInfo] = useState(null)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [allowPageScroll, setAllowPageScroll] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const fetchComplaints = async () => {
      const res = await getAllComplaints()
      setComplaints(res.data || [])
      setLoading(false)
    }
    fetchComplaints()
  }, [])
  useEffect(() => {
    if (user?.role === "admin") {
      const stored = localStorage.getItem("admin_allow_page_scroll")
      if (stored !== null) setAllowPageScroll(stored === "true")
    } else {
      setAllowPageScroll(false)
    }
  }, [user])

  const handleResolve = async (id) => {
    try {
      const res = await updateComplaintStatus(id, { status: "completed" })
      setComplaints((prev) => prev.map((c) => (c.id === id ? res.data : c)))
    } catch (error) {
      console.error("Failed to resolve complaint:", error)
      alert("Failed to resolve complaint. Please try again.")
    }
  }

  const openModal = (c) => {
    setSelected(c)
    setModalStatus(c.status)
    setIsModalOpen(true)
    fetchStudentInfo(c.student_id)
  }

  const fetchStudentInfo = async (studentId) => {
    setStudentInfo(null)
    setLoadingStudent(true)
    try {
      const res = await getStudentById(studentId)
      setStudentInfo(res.data || null)
    } catch (err) {
      console.error('Failed to fetch student info', err)
      setStudentInfo(null)
    } finally {
      setLoadingStudent(false)
    }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await updateComplaintStatus(selected.id, { status: modalStatus })
      setComplaints((prev) => prev.map((c) => (c.id === selected.id ? res.data : c)))
      setIsModalOpen(false)
      setSelected(null)
      setStudentInfo(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update complaint status')
    } finally {
      setSaving(false)
    }
  }

  const getSeverityMeta = (sevRaw) => {
    const sev = Number(sevRaw) || 0
    switch (sev) {
      case 1:
        return { dotClass: 'bg-indigo-500', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600', label: 'Low' }
      case 2:
        return { dotClass: 'bg-sky-400', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', label: 'Minor' }
      case 3:
        return { dotClass: 'bg-amber-500', badgeBg: 'bg-amber-50', badgeText: 'text-amber-600', label: 'Moderate' }
      case 4:
        return { dotClass: 'bg-orange-400', badgeBg: 'bg-orange-50', badgeText: 'text-orange-600', label: 'Major' }
      case 5:
      default:
        return { dotClass: 'bg-rose-600', badgeBg: 'bg-rose-50', badgeText: 'text-rose-600', label: 'Critical' }
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">Complaints</h1>
        </div>
        {user?.role === "admin" && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allowPageScroll}
              onChange={(e) => {
                setAllowPageScroll(e.target.checked)
                localStorage.setItem("admin_allow_page_scroll", e.target.checked)
              }}
              className="w-4 h-4"
            />
            <span>Allow page scroll</span>
          </label>
        )}
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Student</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Title</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Severity</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Status</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-slate-500">
                  Loading complaints...
                </td>
              </tr>
            ) : (
              complaints?.map((c) => (
                <tr
                      key={c.id}
                      className="border-b border-slate-50 hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // don't open modal when clicking the resolve button
                        if (e.target.closest('button')) return
                        openModal(c)
                      }}
                    >
                  <td className="px-6 py-4 text-slate-700">{c.student_id}</td>
                  <td className="px-6 py-4 text-slate-700">{c.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {(() => {
                        const meta = getSeverityMeta(c.severity)
                        return Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-3 h-3 rounded-full ${i < c.severity ? meta.dotClass : "bg-slate-200"}`}
                          />
                        ))
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{c.status}</td>
                  <td className="px-6 py-4">
                    {c.status !== "completed" && (
                        <Button variant="primary" size="sm" onClick={() => handleResolve(c.id)}>
                          <CheckCircle2 className="w-4 h-4" />
                          Resolve
                        </Button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelected(null); setStudentInfo(null) }}
        title={selected ? `Complaint #${selected.id || ''}` : 'Complaint Details'}
        maxWidthClass="max-w-2xl"
        overlayClassName="bg-black/50 backdrop-blur-sm"
        contentClassName="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl shadow-sm p-6"
        lockScroll={!allowPageScroll}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); setSelected(null); setStudentInfo(null) }} size="sm">Cancel</Button>
            <Button variant="primary" onClick={handleSave} size="md" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        )}
      >
        {selected && (
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-slate-700">Title</div>
                <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 text-slate-900 text-lg font-semibold">{selected.title}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700">Description</div>
              <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 text-slate-800 whitespace-pre-wrap max-h-[4.5rem] overflow-y-auto">
                {selected.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 items-start">
              <div>
                <div className="text-sm font-medium text-slate-700">Student</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {loadingStudent ? 'Loading…' : (studentInfo?.full_name || studentInfo?.email || selected.student_id)}
                  <span className="ml-2 text-sm font-normal text-slate-500">(ID: {selected.student_id})</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">Status</div>
                <div className="mt-1">
                  <select value={modalStatus} onChange={(e) => setModalStatus(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white/90 text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-teal-200">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700">Severity</div>
              <div className="mt-2 flex items-center gap-3">
                {(() => {
                  const sev = Number(selected.severity) || 0
                  const meta = getSeverityMeta(sev)
                  return (
                    <>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`${i < sev ? meta.dotClass : 'bg-slate-200'} w-3 h-3 rounded-full`} />
                        ))}
                      </div>
                      <span className={`${meta.badgeBg} ${meta.badgeText} ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold`}>{meta.label}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default Complaints
