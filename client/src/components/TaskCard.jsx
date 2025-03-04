import React from 'react'
import Button from './Button'
import { useAuth } from '../context/AuthContext'
import { approveTask, rejectTask, completeTask } from '../api/taskApi'

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-slate-100 text-slate-800'
  }
  return <span className={`px-2 py-1 text-xs font-medium rounded ${map[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>
}

export default function TaskCard({ task, onUpdate }) {
  const { user } = useAuth()

  const canApprove = user?.role === 'admin' && task.status === 'pending'
  const canComplete = (user && (user.id === task.requested_by || user.id === task.assigned_to)) || user?.role === 'admin'

  const handleApprove = async () => {
    try {
      await approveTask(task.id)
      onUpdate && onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async () => {
    try {
      await rejectTask(task.id)
      onUpdate && onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  const handleComplete = async () => {
    try {
      await completeTask(task.id)
      onUpdate && onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold">{task.title}</h4>
          <div className="text-xs text-slate-500">{task.description?.slice?.(0, 180)}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={task.status} />
          <div className="text-xs text-slate-400">Due: {task.due_at ? new Date(task.due_at).toLocaleString() : '—'}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {canApprove && (
          <>
            <Button variant="primary" size="sm" onClick={handleApprove}>Approve</Button>
            <Button variant="danger" size="sm" onClick={handleReject}>Reject</Button>
          </>
        )}

        {task.status !== 'completed' && canComplete && (
          <Button variant="secondary" size="sm" onClick={handleComplete}>Mark Completed</Button>
        )}
      </div>
    </div>
  )
}
