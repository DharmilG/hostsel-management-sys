import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import TaskCard from '../../components/TaskCard'
import { listTasks } from '../../api/taskApi'

const TaskAdmin = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await listTasks({ status: 'pending', limit: 500 })
      setTasks(res || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Task Requests</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div>Loading...</div> : (
          tasks.map((t) => <TaskCard key={t.id} task={t} onUpdate={fetchPending} />)
        )}
      </div>
    </DashboardLayout>
  )
}

export default TaskAdmin
