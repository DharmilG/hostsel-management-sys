import { Home, CalendarCheck, AlertCircle, Wallet } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"


const Dashboard = () => {
  return (
    <DashboardLayout>
        <h1 className="text-3xl font-semibold text-slate-800 mb-8">
          Student Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Room</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">A-101</p>
          </div>

          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Attendance</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">92%</p>
          </div>

          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Complaints</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">1 Open</p>
          </div>

          <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-slate-700" />
              <span className="text-slate-700 font-medium">Fees</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4">Paid</p>
          </div>
        </div>
    </DashboardLayout>
  )
}

export default Dashboard
