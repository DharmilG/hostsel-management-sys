import { useEffect, useState } from "react"
import { Wallet, CheckCircle2 } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getAllFees, updateFeeStatus } from "../../api/feeApi"

const FeeManagement = () => {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFees = async () => {
      const res = await getAllFees()
      setFees(res.data)
      setLoading(false)
    }
    fetchFees()
  }, [])

  const markPaid = async (id) => {
    const res = await updateFeeStatus(id, {
      payment_status: "paid",
      payment_date: new Date().toISOString().split("T")[0]
    })
    setFees((prev) =>
      prev.map((f) => (f.id === id ? res.data : f))
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          Fee Management
        </h1>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Student ID</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Amount</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Type</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Status</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-slate-500">
                  Loading fees...
                </td>
              </tr>
            ) : (
              fees?.map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700">{fee.student_id}</td>
                  <td className="px-6 py-4 text-slate-700">₹{fee.amount}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{fee.fee_type}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{fee.payment_status}</td>
                  <td className="px-6 py-4">
                    {fee.payment_status !== "paid" && (
                      <button
                        onClick={() => markPaid(fee.id)}
                        className="bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl transition-all px-3 py-1.5 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

export default FeeManagement
