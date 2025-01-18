import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getAllComplaints, updateComplaintStatus } from "../../api/complaintApi"

const Complaints = () => {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComplaints = async () => {
      const res = await getAllComplaints()
      setComplaints(res.data || [])
      setLoading(false)
    }
    fetchComplaints()
  }, [])

  const handleResolve = async (id) => {
    const res = await updateComplaintStatus(id, { status: "completed" })
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? res.data : c))
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Complaints
        </h1>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Student</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Title</th>
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
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700">{c.student_id}</td>
                  <td className="px-6 py-4 text-slate-700">{c.title}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{c.status}</td>
                  <td className="px-6 py-4">
                    {c.status !== "completed" && (
                      <button
                        onClick={() => handleResolve(c.id)}
                        className="bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl transition-all px-3 py-1.5 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Resolve
                      </button>
                    )}
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

export default Complaints
