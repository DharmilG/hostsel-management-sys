import React, { useState } from "react"
import Button from "./Button"
import FileUpload from "./FileUpload"

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

/**
 * LeaveRequestForm — form for creating a staff leave request.
 *
 * Props:
 *   initial:  object with pre-filled values (for editing)
 *   onSubmit: (payload) => void — called with validated payload
 *   onCancel: () => void
 */
const LeaveRequestForm = ({ initial = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    leave_type: initial.leave_type || "sick",
    start_time: initial.start_time ? toLocalDateTimeInput(initial.start_time) : "",
    end_time: initial.end_time ? toLocalDateTimeInput(initial.end_time) : "",
    partial: !!initial.partial,
    partial_date: initial.partial_start_time
      ? toLocalDateInput(initial.partial_start_time)
      : initial.start_time
        ? toLocalDateInput(initial.start_time)
        : "",
    partial_start_time: initial.partial_start_time ? toLocalTimeInput(initial.partial_start_time) : "",
    partial_end_time: initial.partial_end_time ? toLocalTimeInput(initial.partial_end_time) : "",
    reason: initial.reason || "",
    // attachments now stores actual uploaded file objects: [{ file_ref, original_name, mime_type, size }]
    attachments: initial.attachments || []
  })

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const togglePartial = (checked) => {
    if (checked && form.start_time) {
      const d = new Date(form.start_time)
      setField("partial_date", `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
      setField("partial_start_time", `${pad(d.getHours())}:${pad(d.getMinutes())}`)
      const d2 = new Date(d.getTime() + 60 * 60 * 1000)
      setField("partial_end_time", `${pad(d2.getHours())}:${pad(d2.getMinutes())}`)
    }
    setField("partial", checked)
  }

  const handleAttachmentsChange = (uploadedFiles) => {
    setField("attachments", uploadedFiles)
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
      const s = new Date(`${form.partial_date}T${form.partial_start_time}`)
      const eTime = new Date(`${form.partial_date}T${form.partial_end_time}`)
      if (isNaN(s) || isNaN(eTime)) { alert("Invalid partial date/time"); return }
      if (s >= eTime) { alert("Partial start must be before partial end"); return }
      partialStartIso = s.toISOString()
      partialEndIso = eTime.toISOString()
      startIso = partialStartIso
      endIso = partialEndIso
    } else {
      if (!form.start_time || !form.end_time) {
        alert("Please select start and end date/time for the leave")
        return
      }
      const s = new Date(form.start_time)
      const eTime = new Date(form.end_time)
      if (isNaN(s) || isNaN(eTime)) { alert("Invalid start or end date/time"); return }
      if (s >= eTime) { alert("Start must be before end"); return }
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
      // Store as JSON array of { file_ref, original_name, mime_type, size }
      attachments: form.attachments
    }

    onSubmit && onSubmit(payload)
  }

  const inputCls = "w-full mt-2 bg-white/60 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--button-black)]/20 focus:border-[color:var(--button-black)] transition-colors text-slate-800"
  const labelCls = "text-sm font-medium text-slate-700"

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Leave Type */}
      <div>
        <label className={labelCls}>Leave Type</label>
        <select
          value={form.leave_type}
          onChange={(e) => setField("leave_type", e.target.value)}
          className={inputCls}
        >
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal Leave</option>
          <option value="short">Short Leave</option>
          <option value="emergency">Emergency</option>
          <option value="unpaid">Unpaid Leave</option>
        </select>
      </div>

      {/* Date/Time Fields */}
      {!form.partial ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start Date &amp; Time</label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setField("start_time", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Date &amp; Time</label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setField("end_time", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              value={form.partial_date}
              onChange={(e) => setField("partial_date", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Start Time</label>
            <input
              type="time"
              value={form.partial_start_time}
              onChange={(e) => setField("partial_start_time", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Time</label>
            <input
              type="time"
              value={form.partial_end_time}
              onChange={(e) => setField("partial_end_time", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* Partial day toggle */}
      <div className="flex items-center gap-2">
        <input
          id="partial"
          type="checkbox"
          checked={form.partial}
          onChange={(e) => togglePartial(e.target.checked)}
          className="accent-[color:var(--color-primary)] w-4 h-4"
        />
        <label htmlFor="partial" className="text-sm text-slate-700 cursor-pointer">
          Partial day (select specific hours)
        </label>
      </div>

      {/* Reason */}
      <div>
        <label className={labelCls}>Reason <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          value={form.reason}
          onChange={(e) => setField("reason", e.target.value)}
          rows={3}
          placeholder="Describe your reason for leave…"
          className="w-full mt-2 bg-white/60 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--button-black)]/20 focus:border-[color:var(--button-black)] transition-colors text-slate-800 resize-none"
        />
      </div>

      {/* Attachments — Real upload via FileUpload component */}
      <FileUpload
        label="Attachments"
        helpText="Medical certificates, docs (PDF/image/text, max 10MB each)"
        value={form.attachments}
        onChange={handleAttachmentsChange}
        maxFiles={5}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary">Submit Request</Button>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
      </div>
    </form>
  )
}

export default LeaveRequestForm
