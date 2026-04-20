import { useEffect, useState } from "react"
import { CalendarCheck } from "lucide-react"
import Button from "../../components/Button"
import DashboardLayout from "../../components/DashboardLayout"
import { getAttendanceByStudent, markAttendance } from "../../api/attendanceApi"
import { useAuth } from "../../context/AuthContext"

const Attendance = () => {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      const res = await getAttendanceByStudent(user.id)
      setRecords(res.data)
      setLoading(false)
    }
    fetchAttendance()
  }, [user.id])

  const markToday = async () => {
    const today = new Date().toISOString().split("T")[0]
    const res = await markAttendance({
      student_id: user.id,
      attendance_date: today,
      status: "present"
    })
    setRecords((prev) => [res.data, ...prev])
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">
            Attendance
          </h1>
        </div>

        <Button onClick={markToday} variant="primary">Mark Present</Button>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Date</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="2" className="px-6 py-6 text-center text-slate-500">
                  Loading attendance...
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700">
                    {r.attendance_date}
                  </td>
                  <td className="px-6 py-4 text-slate-700 capitalize">
                    {r.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

export default Attendance
