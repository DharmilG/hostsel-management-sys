import { useState, useEffect } from "react"
import { Users, Plus, Trash2 } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import Modal from "../../components/Modal"
import Button from "../../components/Button"
import {
  getAllStudents,
  createStudent,
  deleteStudent
} from "../../api/studentApi"

const StudentManagement = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    roll_no: "",
    full_name: "",
    course: "",
    year: "",
    contact_number: "",
    email: "",
    emergency_contact: "",
    address: ""
  })

  const fetchStudents = async () => {
    try {
      const res = await getAllStudents()
      setStudents(res.data || [])
    } catch (error) {
      console.error("Failed to fetch students:", error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(id)
        setStudents((prev) => prev.filter((s) => s.id !== id))
      } catch (error) {
        console.error("Failed to delete student:", error)
        alert("Failed to delete student. Please try again.")
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await createStudent(form)
      setStudents((prev) => [res.data, ...prev])
      setOpen(false)
    } catch (error) {
      console.error("Failed to create student:", error)
      alert("Failed to create student. Please try again.")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-800">
            Student Management
          </h1>
        </div>

        <Button onClick={() => setOpen(true)} variant="primary">
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Roll No</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Name & Email</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Course</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Contact Info</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Address</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-slate-500">
                  Loading students...
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700">{student.roll_no}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-xs text-slate-400">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {student.course} <span className="text-slate-400 text-xs">(Year {student.year})</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <div>{student.contact_number}</div>
                    <div className="text-xs text-slate-400">Emergency: {student.emergency_contact}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-sm max-w-[200px] truncate" title={student.address}>
                    {student.address}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(student.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Student"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Roll No"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
          />
          <input
            placeholder="Full Name"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            placeholder="Course"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) => setForm({ ...form, course: e.target.value })}
          />
          <input
            placeholder="Year"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
          <input
            placeholder="Contact"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) =>
              setForm({ ...form, contact_number: e.target.value })
            }
          />
          <input
            placeholder="Email"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Emergency Contact"
            className="w-full bg-white/60 border border-slate-200 rounded-full px-4 py-2"
            onChange={(e) =>
              setForm({ ...form, emergency_contact: e.target.value })
            }
          />
          <textarea
            placeholder="Address"
            className="w-full bg-white/60 border border-slate-200 rounded-2xl px-4 py-2"
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <Button type="submit" variant="primary" className="w-full">Save Student</Button>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default StudentManagement
