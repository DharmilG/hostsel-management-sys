import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ClipboardList,
  Wallet,
  Bell,
  FileText,
  DollarSign
  ,ClipboardCheck
} from "lucide-react"
import { useAuth } from "../context/AuthContext"

const Sidebar = () => {
  const { user } = useAuth()

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
    { to: "/admin/complaints", label: "Complaints", icon: ClipboardList },
    { to: "/admin/fees", label: "Fees", icon: Wallet },
    { to: "/admin/announcements", label: "Announcements", icon: Bell },
    { to: "/admin/leave-requests", label: "Leave Requests", icon: FileText },
    { to: "/admin/timesheets", label: "Timesheets", icon: FileText },
    { to: "/admin/payroll", label: "Payroll", icon: DollarSign },
    { to: "/admin/tasks", label: "Tasks", icon: ClipboardCheck }
  ]

  const studentLinks = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/attendance", label: "Attendance", icon: ClipboardList },
    { to: "/student/complaints", label: "Complaints", icon: ClipboardList },
    { to: "/student/fees", label: "Fees", icon: Wallet },
    { to: "/student/notifications", label: "Notifications", icon: Bell }
  ]

  const staffLinks = [
    { to: "/staff", label: "Profile", icon: LayoutDashboard, end: true },
    { to: "/staff/tasks", label: "Tasks", icon: ClipboardCheck }
    ,{ to: "/staff/leave-requests", label: "Leave Requests", icon: ClipboardList }
  ]

  const links = user?.role === "admin" ? adminLinks : (user?.role === "staff" ? staffLinks : studentLinks)

  return (
    <aside className="w-64 bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <nav className="space-y-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#FFDEE9] to-[#B5FFFC] text-slate-900"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
