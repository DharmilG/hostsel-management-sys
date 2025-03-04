import { useEffect, useState } from "react"
import { BedDouble, UserPlus } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import { getAllRooms } from "../../api/roomApi"
import { getAllStudents } from "../../api/studentApi"
import { createRoomAllocation, deleteRoomAllocation } from "../../api/roomAllocationApi"

const RoomAllocation = () => {
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [modalRoomId, setModalRoomId] = useState("")
  const [selectedStudentIdForRoom, setSelectedStudentIdForRoom] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [openRooms, setOpenRooms] = useState({})
  const [hoveredRoomId, setHoveredRoomId] = useState(null)
  const [lastAssignedId, setLastAssignedId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomRes = await getAllRooms()
        const studentRes = await getAllStudents()
        setRooms(roomRes.data || [])
        setStudents(studentRes.data || [])
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setRooms([])
        setStudents([])
      }
    }
    fetchData()
  }, [])

  const refreshData = async () => {
    try {
      const roomRes = await getAllRooms()
      const studentRes = await getAllStudents()
      setRooms(roomRes.data || [])
      setStudents(studentRes.data || [])
    } catch (error) {
      console.error("Failed to refresh data:", error)
    }
  }

  const openAssignForStudent = (student) => {
    setSelectedStudent(student)
    setModalRoomId("")
    setSelectedStudentIdForRoom("")
    setAssignOpen(true)
  }

  const openAssignForRoom = (room) => {
    setModalRoomId(room.id)
    setSelectedStudent(null)
    setSelectedStudentIdForRoom("")
    setAssignOpen(true)
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    // two modal modes: assign-by-student (selectedStudent set) or assign-by-room (modalRoomId set)
    if (selectedStudent) {
      if (!modalRoomId) return alert('Please select a room')
    } else {
      if (!modalRoomId) return alert('Please select a room')
      if (!selectedStudentIdForRoom) return alert('Please select a student')
    }
    setAssigning(true)
    try {
      let assignedStudentId = null
      if (selectedStudent) {
        assignedStudentId = selectedStudent.id
        await createRoomAllocation({ student_id: assignedStudentId, room_id: Number(modalRoomId) })
      } else {
        assignedStudentId = Number(selectedStudentIdForRoom)
        await createRoomAllocation({ student_id: assignedStudentId, room_id: Number(modalRoomId) })
      }

      // mark for enter animation and refresh
      setLastAssignedId(assignedStudentId)
      setAssignOpen(false)
      setSelectedStudent(null)
      setModalRoomId("")
      setSelectedStudentIdForRoom("")
      await refreshData()
      // clear the marker after animation
      setTimeout(() => setLastAssignedId(null), 1200)
    } catch (err) {
      console.error('Failed to assign room', err)
      alert(err?.message || 'Failed to assign room')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async (allocationId) => {
    if (!allocationId) return alert('Allocation id missing')
    try {
      await deleteRoomAllocation(allocationId)
      await refreshData()
    } catch (err) {
      console.error('Failed to unassign', err)
      alert('Failed to unassign student')
    }
  }

  const handleDragStart = (e, student) => {
    const payload = JSON.stringify({ studentId: student.id, allocationId: student.allocation_id || null })
    e.dataTransfer.setData('text/plain', payload)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleRoomDragOver = (e) => {
    e.preventDefault()
  }

  const handleRoomDragEnter = (roomId) => {
    setHoveredRoomId(roomId)
  }

  const handleRoomDragLeave = () => {
    setHoveredRoomId(null)
  }

  const handleRoomDrop = async (e, roomId) => {
    e.preventDefault()
    setHoveredRoomId(null)
    let payload = null
    try {
      payload = JSON.parse(e.dataTransfer.getData('text/plain') || '{}')
    } catch (err) {
      console.error('Invalid drop payload', err)
      return
    }
    if (!payload || !payload.studentId) return
    try {
      await createRoomAllocation({ student_id: payload.studentId, room_id: roomId })
      setLastAssignedId(payload.studentId)
      await refreshData()
      setTimeout(() => setLastAssignedId(null), 1200)
    } catch (err) {
      console.error('Failed to assign on drop', err)
      alert('Failed to assign student to room')
    }
  }

  const modalTitle = selectedStudent
    ? `Assign room to ${selectedStudent.full_name}`
    : modalRoomId
    ? `Assign student to ${rooms.find((r) => String(r.id) === String(modalRoomId))?.room_number || 'room'}`
    : 'Assign Room'

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <BedDouble className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Room Allocation
        </h1>
      </div>
        <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title={modalTitle}>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
              {selectedStudent ? (
                <div>
                  <label className="block text-sm text-slate-700">Room</label>
                  <select value={modalRoomId} onChange={(e) => setModalRoomId(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded">
                    <option value="">Select room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_number}{room.block ? ` • ${room.block}` : ""} {room.capacity ? ` (cap ${room.capacity})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-slate-700">Student</label>
                  <select value={selectedStudentIdForRoom} onChange={(e) => setSelectedStudentIdForRoom(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded">
                    <option value="">Select student</option>
                    {students.filter((s) => !s.room_id).map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name} • {s.roll_no}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={assigning}>{assigning ? 'Assigning...' : 'Assign'}</Button>
              </div>
            </form>
            </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Available Rooms
          </h2>

          <div className="space-y-3">
            
            {rooms.map((room) => {
              const assignedForRoom = students.filter((s) => s.room_id === room.id)
              return (
                <div key={room.id} className="">
                  <div
                    onClick={() => setOpenRooms((prev) => ({ ...prev, [room.id]: !prev[room.id] }))}
                    onDragOver={handleRoomDragOver}
                    onDragEnter={() => handleRoomDragEnter(room.id)}
                    onDragLeave={handleRoomDragLeave}
                    onDrop={(e) => handleRoomDrop(e, room.id)}
                    className={`flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100 cursor-pointer ${hoveredRoomId === room.id ? 'ring-2 ring-offset-2 ring-indigo-200' : ''}`}
                  >
                    <div>
                      <p className="text-slate-800 font-medium">{room.room_number} <span className="text-slate-400 text-sm">{room.block ? `• ${room.block}` : ''}</span></p>
                      <p className="text-slate-500 text-sm">Capacity: {room.capacity} | Occupied: {room.occupied_count} — {assignedForRoom.length} assigned</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); openAssignForRoom(room) }} className="text-slate-500 hover:bg-white/50 hover:text-slate-900 p-2">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className={`mt-2 pl-4 overflow-hidden collapse-transition ${openRooms[room.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!openRooms[room.id]}>
                    {assignedForRoom.length === 0 ? (
                      <div className="text-sm text-slate-400">No students assigned</div>
                    ) : (
                      assignedForRoom.map((s) => (
                        <div key={s.id} className={`flex items-center justify-between p-3 bg-white/60 rounded-2xl border border-slate-100 mt-2 shadow-sm ${s.id === lastAssignedId ? 'animate-fade-in-up' : 'transition-transform'}`}>
                          <div draggable onDragStart={(e) => handleDragStart(e, s)} className="select-none flex items-center gap-3">
                            <span className="student-accent" />
                            <div>
                              <div className="font-medium">{s.full_name}</div>
                              <div className="text-xs text-slate-400">Roll: {s.roll_no}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleUnassign(s.allocation_id)} className="text-red-500">Unassign</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Students
          </h2>

          <div className="space-y-3">
            {students.filter((s) => !s.room_id).map((student) => (
              <div
                key={student.id}
                draggable
                onDragStart={(e) => handleDragStart(e, student)}
                className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100"
              >
                <div>
                  <p className="text-slate-800 font-medium">
                    {student.full_name}
                  </p>
                  <p className="text-slate-500 text-sm">
                    Roll No: {student.roll_no}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openAssignForStudent(student)} className="text-slate-500 hover:bg-white/50 hover:text-slate-900 px-3 py-1 text-sm">
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RoomAllocation
