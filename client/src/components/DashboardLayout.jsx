import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white selection:bg-teal-200 selection:text-teal-900 relative overflow-hidden">
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-[#FFDEE9] blur-[100px] opacity-60" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-[#B5FFFC] blur-[120px] opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <Navbar />
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
