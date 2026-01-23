import { LayoutDashboard, Users, BedDouble, ClipboardList } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"

const Dashboard = () => {
  return (
    <DashboardLayout>
        <h1 className="text-3xl font-semibold text-slate-800 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Students</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">120</p>
          </div>

          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <BedDouble className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Rooms</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">45</p>
          </div>

          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Complaints</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">8</p>
          </div>

          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Occupancy</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">82%</p>
          </div>
        </div>
    </DashboardLayout>
  )
}

export default Dashboard
