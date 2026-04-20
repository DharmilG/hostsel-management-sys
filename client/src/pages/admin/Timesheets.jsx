import React, { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getTimesheet } from '../../api/clockApi'

const Timesheets = () => {
  const [userId, setUserId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    setLoading(true)
    try {
      const params = { user_id: userId || 'me' }
      if (start) params.start = start
      if (end) params.end = end
      const res = await getTimesheet(params)
      setResult(res.data)
    } catch (e) {
      setResult({ error: e?.message || 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Timesheets</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-4xl">
        <input placeholder="user id or 'me'" value={userId} onChange={(e) => setUserId(e.target.value)} className="px-3 py-2 border rounded" />
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="px-3 py-2 border rounded" />
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="px-3 py-2 border rounded" />
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={handleFetch} disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded-xl">Fetch</button>
      </div>

      {result && (
        <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 max-w-4xl">
          {result.error ? (
            <div className="text-red-600">{result.error}</div>
          ) : (
            <div>
              <h3 className="font-semibold mb-2">{result.data?.user?.username || 'User'}</h3>
              <div className="text-sm">Total hours: {result.data?.total_hours?.toFixed?.(2) ?? 0}</div>
              <div className="text-sm">Regular hours: {(result.data?.regular_seconds/3600)?.toFixed?.(2) ?? 0}</div>
              <div className="text-sm">Overtime hours: {(result.data?.overtime_seconds/3600)?.toFixed?.(2) ?? 0}</div>

              <div className="mt-4">
                <h4 className="font-medium">Pairs</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {(result.data?.pairs || []).map((p, i) => (
                    <li key={i} className="p-2 border rounded">{p.in} → {p.out} — {(p.seconds/3600).toFixed(2)}h</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

export default Timesheets
