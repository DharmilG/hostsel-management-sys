import DashboardLayout from "../../components/DashboardLayout"
import { useAuth } from "../../context/AuthContext"

const StaffDashboard = () => {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-800">Staff Profile</h1>
        </div>

        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 max-w-3xl">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-slate-700">Name</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{user?.username || user?.email}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700">Email</div>
              <div className="mt-1 text-lg text-slate-900">{user?.email}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-slate-700">Role</div>
            <div className="mt-1 text-slate-900">{user?.role}</div>
          </div>

          <div className="mt-6 text-sm text-slate-600">Only read-only profile is available here. To edit profile fields, use a paired hostel device and wait for admin approval.</div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default StaffDashboard
