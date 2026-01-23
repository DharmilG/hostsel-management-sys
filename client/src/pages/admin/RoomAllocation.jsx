import { useEffect, useState } from "react"
import { BedDouble, UserPlus } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getAllRooms } from "../../api/roomApi"
import { getAllStudents } from "../../api/studentApi"

const RoomAllocation = () => {
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const roomRes = await getAllRooms()
      const studentRes = await getAllStudents()
      setRooms(roomRes.data)
      setStudents(studentRes.data)
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <BedDouble className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Room Allocation
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Available Rooms
          </h2>

          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100"
              >
                <div>
                  <p className="text-slate-800 font-medium">
                    {room.room_number}
                  </p>
                  <p className="text-slate-500 text-sm">
                    Capacity: {room.capacity} | Occupied: {room.occupied_count}
                  </p>
                </div>
                <button className="text-slate-500 hover:bg-white/50 hover:text-slate-900 rounded-xl transition-colors p-2">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Students
          </h2>

          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
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
                <button className="text-slate-500 hover:bg-white/50 hover:text-slate-900 rounded-xl transition-colors px-3 py-1 text-sm">
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RoomAllocation
