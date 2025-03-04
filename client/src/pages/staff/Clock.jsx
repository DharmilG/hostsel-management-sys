import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import DeviceClockPanel from '../../components/DeviceClockPanel'

const StaffClock = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Clock In / Out</h1>
      </div>

      <div className="max-w-md">
        <DeviceClockPanel />
      </div>
    </DashboardLayout>
  )
}

export default StaffClock
