import React, { useState } from "react"
import Button from "./Button"

// Helpers to format ISO dates for input controls
const pad = (n) => String(n).padStart(2, "0")
const toLocalDateTimeInput = (iso) => {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toLocalDateInput = (iso) => {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const toLocalTimeInput = (iso) => {
  if (!iso) return ""
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const LeaveRequestForm = ({ initial = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    leave_type: initial.leave_type || "sick",
    // store values in input-friendly formats
    start_time: initial.start_time ? toLocalDateTimeInput(initial.start_time) : "",
    end_time: initial.end_time ? toLocalDateTimeInput(initial.end_time) : "",
    partial: !!initial.partial,
    // partial uses a date + time inputs (date -> yyyy-mm-dd, times -> HH:MM)
    partial_date: initial.partial_start_time ? toLocalDateInput(initial.partial_start_time) : (initial.start_time ? toLocalDateInput(initial.start_time) : ""),
    partial_start_time: initial.partial_start_time ? toLocalTimeInput(initial.partial_start_time) : "",
    partial_end_time: initial.partial_end_time ? toLocalTimeInput(initial.partial_end_time) : "",
    reason: initial.reason || "",
    attachments: initial.attachments || []
  })

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    // For MVP we send file names as attachment placeholders. Real upload can be added later.
    setField("attachments", files.map((f) => ({ name: f.name })))
  }

  const togglePartial = (checked) => {
    if (checked) {
      // derive partial date/time from existing start_time if present
      if (form.start_time) {
        const d = new Date(form.start_time)
        setField("partial_date", `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
        setField("partial_start_time", `${pad(d.getHours())}:${pad(d.getMinutes())}`)
        // default partial_end_time to 1 hour later
        const d2 = new Date(d.getTime() + 60 * 60 * 1000)
        setField("partial_end_time", `${pad(d2.getHours())}:${pad(d2.getMinutes())}`)
      }
    } else {
      // switching back to full-day inputs: if partial date+times exist, populate start_time/end_time
      if (form.partial_date && form.partial_start_time) {
        setField("start_time", `${form.partial_date}T${form.partial_start_time}`)
      }
      if (form.partial_date && form.partial_end_time) {
        setField("end_time", `${form.partial_date}T${form.partial_end_time}`)
      }
    }
    setField("partial", checked)
  }

  const submit = (e) => {
    e.preventDefault()

    let startIso = null
    let endIso = null
    let partialStartIso = null
    let partialEndIso = null

    if (form.partial) {
      if (!form.partial_date || !form.partial_start_time || !form.partial_end_time) {
        alert("Please select date and start/end times for a partial day request.")
        return
      }
      // combine date + time -> ISO
      startIso = new Date(`${form.partial_date}T${form.partial_start_time}`)
      endIso = new Date(`${form.partial_date}T${form.partial_end_time}`)
      if (isNaN(startIso) || isNaN(endIso)) {
        alert("Invalid partial date/time")
        return
      }
      if (startIso >= endIso) {
        alert("Partial start must be before partial end")
        return
      }
      partialStartIso = startIso.toISOString()
      partialEndIso = endIso.toISOString()
      // also set canonical start/end so server columns (not-null) are satisfied
      startIso = partialStartIso
      endIso = partialEndIso
    } else {
      if (!form.start_time || !form.end_time) {
        alert("Please select start and end date/time for the leave")
        return
      }
      const s = new Date(form.start_time)
      const eTime = new Date(form.end_time)
      if (isNaN(s) || isNaN(eTime)) {
        alert("Invalid start or end date/time")
        return
      }
      if (s >= eTime) {
        alert("Start must be before end")
        return
      }
      startIso = s.toISOString()
      endIso = eTime.toISOString()
    }

    const payload = {
      leave_type: form.leave_type,
      start_time: startIso,
      end_time: endIso,
      partial: form.partial,
      partial_start_time: partialStartIso,
      partial_end_time: partialEndIso,
      reason: form.reason,
      attachments: form.attachments
    }

    onSubmit && onSubmit(payload)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Type</label>
        <select value={form.leave_type} onChange={(e) => setField("leave_type", e.target.value)} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2">
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal Leave</option>
          <option value="short">Short Leave</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {!form.partial ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Start</label>
            <input type="datetime-local" value={form.start_time} onChange={(e) => setField("start_time", e.target.value)} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">End</label>
            <input type="datetime-local" value={form.end_time} onChange={(e) => setField("end_time", e.target.value)} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input type="date" value={form.partial_date} onChange={(e) => setField("partial_date", e.target.value)} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Start time</label>
            <input type="time" value={form.partial_start_time} onChange={(e) => setField("partial_start_time", e.target.value)} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">End time</label>
            <input type="time" value={form.partial_end_time} onChange={(e) => setField("partial_end_time", e.target.value)} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input id="partial" type="checkbox" checked={form.partial} onChange={(e) => togglePartial(e.target.checked)} />
        <label htmlFor="partial" className="text-sm text-slate-700">Partial day</label>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Reason</label>
        <textarea value={form.reason} onChange={(e) => setField("reason", e.target.value)} rows={4} className="w-full mt-2 bg-white/60 border border-slate-200 rounded-2xl px-4 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Attachments (optional)</label>
        <input type="file" onChange={handleFiles} multiple className="mt-2" />
        {form.attachments?.length > 0 && (
          <div className="mt-2 text-sm text-slate-600">{form.attachments.map((a, idx) => <div key={idx}>{a.name}</div>)}</div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary">Request</Button>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
      </div>
    </form>
  )
}

export default LeaveRequestForm
