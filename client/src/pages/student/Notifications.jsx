import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getNotificationsByStudent, markNotificationRead } from "../../api/notificationApi"
import { useAuth } from "../../context/AuthContext"

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await getNotificationsByStudent(user.id)
      setNotifications(res.data)
      setLoading(false)
    }
    fetchNotifications()
  }, [user.id])

  const markRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Notifications
        </h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500">Loading notifications...</div>
        ) : (
          notifications?.map((n) => (
            <div
              key={n.id}
              className={`bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300 ${
                n.is_read ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-slate-700">{n.message}</p>
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-slate-500 hover:bg-white/50 hover:text-slate-900 rounded-xl transition-colors px-3 py-1 text-sm"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

export default Notifications
