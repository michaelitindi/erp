'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, updateTaskStatus } from '@/app/actions/projects'
import { Plus, X, CheckCircle, Circle, Clock, Eye } from 'lucide-react'

interface Task {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  estimatedHours: number | { toNumber: () => number } | null
  actualHours: number | { toNumber: () => number }
}

interface Project {
  id: string
  name: string
  tasks: Task[]
}

export function CreateTaskButton({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createTask({
        projectId,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        priority: formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null,
        estimatedHours: parseFloat(formData.get('estimatedHours') as string) || null,
      })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
        <Plus className="h-3 w-3" />Add Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add Task</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Task Name *</label>
                <input name="name" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                  <select name="priority" defaultValue="MEDIUM" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                  <input name="dueDate" type="date" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Estimated Hours</label>
                <input name="estimatedHours" type="number" min="0" step="0.5" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Adding...' : 'Add Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function TasksBoard({ project }: { project: Project }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const columns = [
    { id: 'TODO', label: 'To Do', icon: Circle, color: 'text-slate-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'text-blue-400' },
    { id: 'REVIEW', label: 'Review', icon: Eye, color: 'text-yellow-400' },
    { id: 'DONE', label: 'Done', icon: CheckCircle, color: 'text-green-400' },
  ]

  const priorityColors: Record<string, string> = {
    LOW: 'border-l-slate-400',
    MEDIUM: 'border-l-blue-400',
    HIGH: 'border-l-orange-400',
    CRITICAL: 'border-l-red-400',
  }

  async function handleStatusChange(taskId: string, status: string) {
    setProcessingId(taskId)
    try { await updateTaskStatus(taskId, status); router.refresh() }
    catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  const getTasksByStatus = (status: string) => project.tasks.filter(t => t.status === status)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {columns.map(column => {
        const tasks = getTasksByStatus(column.id)
        const Icon = column.icon
        return (
          <div key={column.id} className="rounded-xl border border-slate-700 bg-slate-800/30">
            <div className="border-b border-slate-700 p-3 flex items-center gap-2">
              <Icon className={`h-4 w-4 ${column.color}`} />
              <span className="text-sm font-medium text-white">{column.label}</span>
              <span className="text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">{tasks.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {tasks.map(task => (
                <div key={task.id} className={`rounded-lg border border-slate-600 bg-slate-700/50 p-3 border-l-4 ${priorityColors[task.priority]}`}>
                  <p className="text-sm font-medium text-white mb-1">{task.name}</p>
                  {task.description && <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>}
                  {task.dueDate && (
                    <p className="text-xs text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {columns.map(col => (
                      col.id !== task.status && (
                        <button
                          key={col.id}
                          onClick={() => handleStatusChange(task.id, col.id)}
                          disabled={processingId === task.id}
                          className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-600/50 hover:bg-slate-600 disabled:opacity-50"
                        >
                          → {col.label}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">No tasks</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
