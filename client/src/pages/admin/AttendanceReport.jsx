import { useEffect, useState } from "react"
import { CalendarCheck } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getAllAttendance } from "../../api/attendanceApi"

const AttendanceReport = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      const res = await getAllAttendance()
      setAttendance(res.data)
      setLoading(false)
    }
    fetchAttendance()
  }, [])

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <CalendarCheck className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Attendance Report
        </h1>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">
                Student ID
              </th>
              <th className="px-6 py-4 text-slate-500 font-medium">
                Date
              </th>
              <th className="px-6 py-4 text-slate-500 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="3"
                  className="px-6 py-6 text-center text-slate-500"
                >
                  Loading attendance...
                </td>
              </tr>
            ) : (
              attendance.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700">
                    {record.student_id}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {record.attendance_date}
                  </td>
                  <td className="px-6 py-4 text-slate-700 capitalize">
                    {record.status}
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

export default AttendanceReport
