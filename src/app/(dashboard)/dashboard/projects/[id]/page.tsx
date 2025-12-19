import { getProject } from '@/app/actions/projects'
import { CreateTaskButton, TasksBoard } from '@/components/projects/tasks'
import { ArrowLeft, Calendar, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  
  if (!project) notFound()

  const statusColors: Record<string, string> = {
    PLANNING: 'text-slate-400 bg-slate-400/10',
    ACTIVE: 'text-green-400 bg-green-400/10',
    ON_HOLD: 'text-yellow-400 bg-yellow-400/10',
    COMPLETED: 'text-blue-400 bg-blue-400/10',
    CANCELLED: 'text-red-400 bg-red-400/10',
  }

  const tasksByStatus = {
    todo: project.tasks.filter(t => t.status === 'TODO').length,
    inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: project.tasks.filter(t => t.status === 'REVIEW').length,
    done: project.tasks.filter(t => t.status === 'DONE').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>{project.status.replace('_', ' ')}</span>
            </div>
            <p className="text-slate-400 font-mono text-sm">{project.projectNumber}</p>
          </div>
        </div>
        <CreateTaskButton projectId={project.id} />
      </div>

      {project.description && (
        <p className="text-slate-300 border-l-4 border-blue-500 pl-4">{project.description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Calendar className="h-5 w-5 text-blue-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="text-sm font-bold text-white">{project.progress}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><Users className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Total Tasks</p><p className="text-2xl font-bold text-white">{project.tasks.length}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><DollarSign className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Budget</p><p className="text-2xl font-bold text-white">{project.budget ? `$${Number(project.budget).toLocaleString()}` : '—'}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2"><Calendar className="h-5 w-5 text-orange-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Timeline</p>
              <p className="text-xs text-white">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
                {' → '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Task Board</h2>
        <TasksBoard project={project} />
      </div>
    </div>
  )
}
