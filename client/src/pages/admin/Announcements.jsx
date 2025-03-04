import { useEffect, useState } from "react"
import { Megaphone, Plus } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getAllAnnouncements, createAnnouncement } from "../../api/announcementApi"
import Modal from "../../components/Modal"
import Button from "../../components/Button"

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", message: "" })

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getAllAnnouncements()
        setAnnouncements(res.data || [])
      } catch (error) {
        console.error("Failed to fetch announcements:", error)
        setAnnouncements([])
      }
    }
    fetchAnnouncements()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await createAnnouncement(form)
      setAnnouncements((prev) => [res.data, ...prev])
      setOpen(false)
    } catch (error) {
      console.error("Failed to create announcement:", error)
      alert("Failed to create announcement. Please try again.")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">
            Announcements
          </h1>
        </div>

        <Button onClick={() => setOpen(true)} variant="primary">
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
          >
            <h2 className="text-lg font-semibold text-slate-800">{a.title}</h2>
            <p className="text-slate-600 mt-2">{a.message}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Title"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Message"
            className="w-full bg-white/60 border border-slate-200 rounded-2xl px-4 py-2"
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <Button type="submit" variant="primary" className="w-full">Publish</Button>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default Announcements
