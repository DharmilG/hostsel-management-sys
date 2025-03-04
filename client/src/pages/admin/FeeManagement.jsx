import { useEffect, useState, useRef } from "react"
import { Wallet, CheckCircle2, Plus } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import { getAllFees, updateFeeStatus, createFee } from "../../api/feeApi"
import { getAllStudents } from "../../api/studentApi"

const FeeManagement = () => {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [students, setStudents] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ student_id: "", amount: "", fee_type: "other", due_date: "", notes: "" })
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const searchRef = useRef(null)

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const payload = await getAllFees()
        setFees((payload && payload.data) || [])
      } catch (error) {
        console.error("Failed to fetch fees:", error)
        setFees([])
      } finally {
        setLoading(false)
      }
    }

    const fetchStudents = async () => {
      try {
        const s = await getAllStudents()
        setStudents((s && s.data) || [])
      } catch (e) {
        setStudents([])
      }
    }

    fetchFees()
    fetchStudents()
  }, [])

  // compute suggestions when query changes
  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      setSelectedSuggestionIndex(-1)
      return
    }

    const studentMatches = (students || [])
      .filter((s) => {
        const name = (s.full_name || "").toLowerCase()
        const roll = (s.roll_no || "").toLowerCase()
        const room = (s.room_number || "").toLowerCase()
        const idStr = String(s.id || "").toLowerCase()
        return name.includes(q) || roll.includes(q) || room.includes(q) || idStr.includes(q)
      })
      .slice(0, 6)
      .map((s) => ({ kind: "student", id: s.id, label: s.full_name, secondary: s.room_number ? `Room ${s.room_number}` : `Roll ${s.roll_no}`, value: s.full_name }))

    const feeTypes = Array.from(new Set((fees || []).map((f) => f.fee_type).filter(Boolean)))
    const feeMatches = feeTypes.filter((ft) => ft.toLowerCase().includes(q)).map((ft) => ({ kind: "fee", label: ft, value: ft }))

    const combined = [...studentMatches, ...feeMatches]
    setSuggestions(combined)
    setIsSuggestionsOpen(combined.length > 0)
    setSelectedSuggestionIndex(-1)
  }, [query, students, fees])

  useEffect(() => {
    const onDocClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSuggestionSelect = (sug) => {
    if (!sug) return
    // set query to friendly text — filter will match student name/fee type
    setQuery(sug.label || sug.value || "")
    setIsSuggestionsOpen(false)
    setSelectedSuggestionIndex(-1)
  }

  const handleSearchKeyDown = (e) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex((s) => Math.min(s + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionSelect(suggestions[selectedSuggestionIndex])
      }
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false)
    }
  }

  const markPaid = async (id) => {
    try {
      const res = await updateFeeStatus(id, {
        payment_status: "paid",
        payment_date: new Date().toISOString().split("T")[0]
      })
      // API helpers return payload (not a wrapper), so use the returned object
      setFees((prev) => prev.map((f) => (f.id === id ? (res && res.data) || f : f)))
    } catch (error) {
      console.error("Failed to update fee status:", error)
      alert("Failed to mark fee as paid. Please try again.")
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.student_id || !form.amount) return alert('Please select student and amount')
    setCreating(true)
    try {
      const payload = {
        student_id: form.student_id,
        amount: Number(form.amount),
        fee_type: form.fee_type,
        due_date: form.due_date || null,
        notes: form.notes || null,
        payment_status: 'pending'
      }
      const created = await createFee(payload)
      setFees((prev) => [(created && created.data) || created, ...prev])
      setShowCreate(false)
      setForm({ student_id: "", amount: "", fee_type: "other", due_date: "", notes: "" })
    } catch (err) {
      console.error('Failed to create fee', err)
      alert('Failed to create fee. Try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">Fee Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <div ref={searchRef} className="relative">
            <input
              placeholder="Search by student name, ID or type"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => { if (suggestions.length) setIsSuggestionsOpen(true) }}
              className="px-3 py-2 rounded-xl border border-slate-100 bg-white/50 w-72"
            />

            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="suggestion-dropdown animate-fade-in-up" role="listbox">
                {suggestions.map((sug, idx) => (
                  <div
                    key={`${sug.kind}-${sug.id || sug.label}-${idx}`}
                    role="option"
                    aria-selected={selectedSuggestionIndex === idx}
                    onMouseDown={() => handleSuggestionSelect(sug)}
                    onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                    className={`suggestion-item ${selectedSuggestionIndex === idx ? 'bg-indigo-50' : ''}`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {sug.kind === 'student' ? (
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-semibold">{(sug.label || '').split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                    ) : (
                      <div className="px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-700">Type</div>
                    )}

                    <div className="ml-3">
                      <div className="text-sm text-slate-800">{sug.label}</div>
                      {sug.secondary && <div className="text-xs text-slate-400">{sug.secondary}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button variant="export" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            New Fee
          </Button>
        </div>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Student ID</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Amount</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Type</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Status</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-slate-500">
                  Loading fees...
                </td>
              </tr>
            ) : (
              fees
                ?.filter((f) => {
                  const q = query.trim().toLowerCase()
                  if (!q) return true
                  const student = (students || []).find((s) => s.id === f.student_id) || {}
                  const studentName = (student.full_name || "").toLowerCase()
                  const studentRoll = (student.roll_no || "").toLowerCase()
                  const studentRoom = (student.room_number || "").toLowerCase()
                  return (
                    String(f.student_id).toLowerCase().includes(q) ||
                    String(f.fee_type || "").toLowerCase().includes(q) ||
                    studentName.includes(q) ||
                    studentRoll.includes(q) ||
                    studentRoom.includes(q)
                  )
                })
                .map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700">{fee.student_id}</td>
                  <td className="px-6 py-4 text-slate-700">₹{fee.amount}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{fee.fee_type}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{fee.payment_status}</td>
                  <td className="px-6 py-4">
                    {fee.payment_status !== "paid" && (
                      <Button variant="primary" size="sm" onClick={() => markPaid(fee.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Fee" lockScroll={true}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700">Student</label>
            <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded">
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.room_number ? `• Room ${s.room_number}` : '• Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700">Amount</label>
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm text-slate-700">Type</label>
            <select value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded">
              <option value="tuition">Tuition</option>
              <option value="hostel">Hostel</option>
              <option value="fine">Fine</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700">Due date (optional)</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm text-slate-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={creating}>{creating ? 'Creating...' : 'Create Fee'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default FeeManagement
