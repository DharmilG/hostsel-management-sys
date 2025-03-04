import React, { useState, useEffect } from "react"
import Button from "./Button"
import createAPI from "../api/fetchClient"

export default function ShiftForm({ initial = {}, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title || "")
  const [description, setDescription] = useState(initial.description || "")
  const [start, setStart] = useState(initial.start_time ? initial.start_time.slice(0, 16) : "")
  const [end, setEnd] = useState(initial.end_time ? initial.end_time.slice(0, 16) : "")
  const [role, setRole] = useState(initial.role || "")
  const [area, setArea] = useState(initial.area || "")
  const [roomId, setRoomId] = useState(initial.room_id || null)
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    const api = createAPI()
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms')
        setRooms(res.data || [])
      } catch (e) {
        // ignore
      }
    }
    fetchRooms()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      title,
      description,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      role,
      area,
      room_id: roomId || null
    }
    onSubmit && onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-slate-700">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm text-slate-700">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-700">Start</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm text-slate-700">End</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-700">Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Area</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-700">Room (optional)</label>
        <select value={roomId || ""} onChange={(e) => setRoomId(e.target.value || null)} className="w-full mt-1 px-3 py-2 border rounded bg-white">
          <option value="">No room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.room_number}{r.block ? ` • ${r.block}` : ''}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit">Create</Button>
      </div>
    </form>
  )
}
