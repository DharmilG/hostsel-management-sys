import React, { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { exportPayroll } from '../../api/clockApi'

const PayrollExports = () => {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!start || !end) return alert('Provide start and end')
    setLoading(true)
    try {
      const res = await exportPayroll({ start, end })
      // res is the raw response; we expect CSV text
      const text = await res.data
      // handle both cases where data is string or object
      const csv = typeof text === 'string' ? text : (text?.data || '')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll_${start}_${end}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Payroll Exports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-6">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="px-3 py-2 border rounded" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="px-3 py-2 border rounded" />
      </div>

      <div>
        <button onClick={handleExport} disabled={loading} className="px-4 py-2 bg-black text-white rounded-xl">Export CSV</button>
      </div>
    </DashboardLayout>
  )
}

export default PayrollExports
