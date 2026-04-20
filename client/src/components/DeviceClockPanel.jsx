import React, { useState } from 'react'
import Button from './Button'
import { clock } from '../api/clockApi'
import { useAuth } from '../context/AuthContext'

const DeviceClockPanel = ({ deviceId = null, onSuccess }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handle = async (eventType) => {
    setMessage("")
    setLoading(true)
    try {
      const payload = {
        device_id: deviceId,
        event_type: eventType,
        method: 'button',
        client_event_id: `${user?.id || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
      }
      // if user is not authenticated, client must send user_id (kiosk flow)
      if (!user && !payload.user_id) {
        // kiosk should have a separate flow; here we'll fail early
        setMessage('Not authenticated. Use device PIN or kiosk flow.')
        setLoading(false)
        return
      }
      const res = await clock(payload)
      setMessage('Clock recorded')
      onSuccess && onSuccess(res.data)
    } catch (err) {
      setMessage(err?.data?.message || err?.message || 'Failed to record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Clock</h3>
          <p className="text-sm text-slate-500">Tap to clock in or out</p>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={() => handle('clock_in')} disabled={loading}>Clock In</Button>
          <Button variant="secondary" onClick={() => handle('clock_out')} disabled={loading}>Clock Out</Button>
        </div>

        {message && <div className="text-sm text-slate-600">{message}</div>}
      </div>
    </div>
  )
}

export default DeviceClockPanel
