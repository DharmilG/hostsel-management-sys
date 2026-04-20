import React from "react"
import Button from "./Button"

const fmt = (iso) => {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch (e) {
    return iso
  }
}

export default function ShiftCard({ shift, onAssign, onUnassign, isAdmin }) {
  const assigned = shift.assigned_username || shift.assigned_email
  return (
    <div className="p-3 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{shift.title}</h3>
          <div className="text-xs text-slate-600">{fmt(shift.start_time)} — {fmt(shift.end_time)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">{shift.role || 'Any'}</div>
          <div className="text-xs text-slate-500">{shift.area || ''}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-700">
        {shift.description || <span className="text-slate-400">No description</span>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">Assigned: <span className="font-medium text-slate-800">{assigned || '—'}</span></div>
        <div className="flex items-center gap-2">
          {assigned ? (
            <Button variant="danger" size="sm" onClick={() => onUnassign && onUnassign(shift)}>Unassign</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onAssign && onAssign(shift)}>Take / Assign</Button>
          )}
          {isAdmin && shift.assignment_id && (
            <div className="text-xs text-slate-500">({shift.assignment_status})</div>
          )}
        </div>
      </div>
    </div>
  )
}
