import { useEffect, useState } from "react"
import { Wallet } from "lucide-react"
import DashboardLayout from "../../components/DashboardLayout"
import { getFeesByStudent } from "../../api/feeApi"
import { useAuth } from "../../context/AuthContext"

const Fees = () => {
  const { user } = useAuth()
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFees = async () => {
      const res = await getFeesByStudent(user.id)
      setFees(res.data)
      setLoading(false)
    }
    fetchFees()
  }, [user.id])

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-800">
          My Fees
        </h1>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-500 font-medium">Type</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Amount</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Status</th>
              <th className="px-6 py-4 text-slate-500 font-medium">Paid On</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-slate-500">
                  Loading fees...
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-700 capitalize">
                    {fee.fee_type}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    ₹{fee.amount}
                  </td>
                  <td className="px-6 py-4 text-slate-700 capitalize">
                    {fee.payment_status}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {fee.payment_date || "-"}
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

export default Fees
