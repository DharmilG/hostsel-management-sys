import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import TaskCard from '../../components/TaskCard'
import { createTask, listTasks } from '../../api/taskApi'
import { useAuth } from '../../context/AuthContext'

const StaffTasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await listTasks({ limit: 200 })
      setTasks(res || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const handleCreate = async () => {
    if (!title) return alert('Title required')
    try {
      await createTask({ title, description, due_at: dueAt })
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setDueAt('')
      fetchTasks()
    } catch (e) {
      alert('Failed to create')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tasks & Checklists</h1>
        <div>
          <Button onClick={() => setIsOpen(true)}>New Task / Request</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div>Loading...</div> : (
          tasks.map((t) => <TaskCard key={t.id} task={t} onUpdate={fetchTasks} />)
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Task / Checklist">
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Title" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" rows={4} placeholder="Description (optional)" />
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default StaffTasks
