import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"

import Login from "./pages/auth/Login"
import ForgotPassword from "./pages/auth/ForgotPassword"
import Register from "./pages/auth/Register"

import AdminDashboard from "./pages/admin/Dashboard"
import StudentManagement from "./pages/admin/StudentManagement"
import RoomAllocation from "./pages/admin/RoomAllocation"
import AttendanceReport from "./pages/admin/AttendanceReport"
import Complaints from "./pages/admin/Complaints"
import FeeManagement from "./pages/admin/FeeManagement"
import Announcements from "./pages/admin/Announcements"
import ShiftRoster from "./pages/admin/ShiftRoster"
import Timesheets from "./pages/admin/Timesheets"
import PayrollExports from "./pages/admin/PayrollExports"
import TaskAdmin from "./pages/admin/TaskAdmin"

import StudentDashboard from "./pages/student/Dashboard"
import Attendance from "./pages/student/Attendance"
import StudentComplaints from "./pages/student/Complaints"
import Fees from "./pages/student/Fees"
import Notifications from "./pages/student/Notifications"
import StudentAnnouncements from "./pages/student/Announcements"
import StaffDashboard from "./pages/staff/Dashboard"
import StaffClock from "./pages/staff/Clock"
import LeaveRequests from "./pages/staff/LeaveRequests"
import StaffTasks from "./pages/staff/Tasks"
import LeaveAdmin from "./pages/admin/LeaveAdmin"

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/admin/rooms" element={<RoomAllocation />} />
          <Route path="/admin/attendance" element={<AttendanceReport />} />
          <Route path="/admin/complaints" element={<Complaints />} />
          <Route path="/admin/shifts" element={<ShiftRoster />} />
          <Route path="/admin/fees" element={<FeeManagement />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/leave-requests" element={<LeaveAdmin />} />
          <Route path="/admin/timesheets" element={<Timesheets />} />
          <Route path="/admin/payroll" element={<PayrollExports />} />
          <Route path="/admin/tasks" element={<TaskAdmin />} />
        </Route>

        {/* <Route element={<ProtectedRoute allowedRoles={["student"]} />}> */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<Attendance />} />
          <Route path="/student/complaints" element={<StudentComplaints />} />
          <Route path="/student/fees" element={<Fees />} />
          <Route path="/student/notifications" element={<Notifications />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
        {/* </Route> */}

        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/clock" element={<StaffClock />} />
          <Route path="/staff/tasks" element={<StaffTasks />} />
          <Route path="/staff/leave-requests" element={<LeaveRequests />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default AppRoutes
