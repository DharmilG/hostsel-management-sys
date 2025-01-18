import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"

import Login from "./pages/auth/Login"

import AdminDashboard from "./pages/admin/Dashboard"
import StudentManagement from "./pages/admin/StudentManagement"
import RoomAllocation from "./pages/admin/RoomAllocation"
import AttendanceReport from "./pages/admin/AttendanceReport"
import Complaints from "./pages/admin/Complaints"
import FeeManagement from "./pages/admin/FeeManagement"
import Announcements from "./pages/admin/Announcements"

import StudentDashboard from "./pages/student/Dashboard"
import Attendance from "./pages/student/Attendance"
// import StudentComplaints from "./pages/student/Complaints"
import Fees from "./pages/student/Fees"
import Notifications from "./pages/student/Notifications"
import StudentAnnouncements from "./pages/student/Announcements"

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/admin/rooms" element={<RoomAllocation />} />
          <Route path="/admin/attendance" element={<AttendanceReport />} />
          <Route path="/admin/complaints" element={<Complaints />} />
          <Route path="/admin/fees" element={<FeeManagement />} />
          <Route path="/admin/announcements" element={<Announcements />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<Attendance />} />
          {/* <Route path="/student/complaints" element={<StudentComplaints />} /> */}
          <Route path="/student/fees" element={<Fees />} />
          <Route path="/student/notifications" element={<Notifications />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default AppRoutes
