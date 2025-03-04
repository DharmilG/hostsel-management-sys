import { LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="w-full bg-white/60 border border-slate-100 rounded-3xl shadow-sm px-6 py-4 mb-8 flex items-center justify-between hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="w-5 h-5 text-slate-700" />
        <span className="font-medium text-slate-800">Hostel Portal</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-slate-500 text-sm">
          {user?.role === "admin" ? "Admin" : user?.role === "staff" ? "Staff" : "Student"}
        </span>
        <button
          onClick={handleLogout}
          className="text-slate-50 hover:bg-white/50 hover:text-slate-900 rounded-xl transition-colors px-3 py-1.5 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
