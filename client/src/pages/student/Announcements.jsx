import { useEffect, useState } from "react"
import { Megaphone } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getAllAnnouncements } from "../../api/announcementApi"

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const res = await getAllAnnouncements()
      setAnnouncements(res.data)
      setLoading(false)
    }
    fetchAnnouncements()
  }, [])

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Announcements
        </h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500">
            Loading announcements...
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-slate-800">
                {a.title}
              </h2>
              <p className="text-slate-600 mt-2">{a.message}</p>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

export default Announcements
