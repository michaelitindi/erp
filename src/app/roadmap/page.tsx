import { getFeedback } from '@/app/actions/feedback'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, CheckCircle, Clock, PlayCircle, ArrowUp, Lightbulb, Bug, Zap, HelpCircle } from 'lucide-react'

type FeedbackItem = {
  id: string
  title: string
  category: string
  voteCount: number
  _count: { replies: number }
}

const statusConfig = {
  PLANNED: { label: 'Planned', color: 'border-blue-500 bg-blue-500/10', textColor: 'text-blue-400', icon: CheckCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'border-purple-500 bg-purple-500/10', textColor: 'text-purple-400', icon: PlayCircle },
  COMPLETED: { label: 'Completed', color: 'border-green-500 bg-green-500/10', textColor: 'text-green-400', icon: CheckCircle },
}

const categoryIcons: Record<string, typeof Lightbulb> = {
  FEATURE: Lightbulb,
  BUG: Bug,
  IMPROVEMENT: Zap,
  QUESTION: HelpCircle,
}

export default async function RoadmapPage() {
  // Get items by status
  const [planned, inProgress, completed] = await Promise.all([
    getFeedback({ status: 'PLANNED', sort: 'votes', limit: 20 }),
    getFeedback({ status: 'IN_PROGRESS', sort: 'votes', limit: 20 }),
    getFeedback({ status: 'COMPLETED', sort: 'newest', limit: 10 }),
  ])

  const columns = [
    { key: 'PLANNED', title: '📋 Planned', items: planned.items, ...statusConfig.PLANNED },
    { key: 'IN_PROGRESS', title: '🚀 In Progress', items: inProgress.items, ...statusConfig.IN_PROGRESS },
    { key: 'COMPLETED', title: '✅ Completed', items: completed.items, ...statusConfig.COMPLETED },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <h1 className="text-lg font-bold text-white">Product Roadmap</h1>
            <Link href="/feedback" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <MessageSquare className="h-4 w-4" />
              Submit Feedback
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Our Product Roadmap
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            See what we're working on and what's coming next. Vote on features you want to see prioritized.
          </p>
        </div>
      </div>

      {/* Roadmap Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {columns.map(column => {
            const StatusIcon = column.icon
            return (
              <div key={column.key} className="flex flex-col">
                {/* Column Header */}
                <div className={`flex items-center gap-2 p-4 rounded-t-xl border ${column.color}`}>
                  <StatusIcon className={`h-5 w-5 ${column.textColor}`} />
                  <h2 className={`font-semibold ${column.textColor}`}>{column.title}</h2>
                  <span className="ml-auto text-sm text-slate-400">{column.items.length}</span>
                </div>
                
                {/* Items */}
                <div className="flex-1 space-y-3 p-4 bg-slate-800/30 rounded-b-xl border border-t-0 border-slate-700 min-h-[400px]">
                  {column.items.length > 0 ? (
                    column.items.map((item: FeedbackItem) => {
                      const CategoryIcon = categoryIcons[item.category] || Lightbulb
                      return (
                        <Link
                          key={item.id}
                          href={`/feedback/${item.id}`}
                          className="block p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {/* Vote Count */}
                            <div className="flex flex-col items-center px-2 py-1 rounded bg-slate-700/50 text-slate-300">
                              <ArrowUp className="h-4 w-4" />
                              <span className="text-sm font-medium">{item.voteCount}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <CategoryIcon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {item.category.charAt(0) + item.category.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <h3 className="text-sm font-medium text-white line-clamp-2">
                                {item.title}
                              </h3>
                              {item._count.replies > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                  <MessageSquare className="h-3 w-3" />
                                  {item._count.replies}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">No items yet</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Under Review Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            🔍 Under Review
            <span className="text-sm font-normal text-slate-400 ml-2">
              These are being evaluated for the roadmap
            </span>
          </h2>
          <div className="text-center">
            <Link 
              href="/feedback"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              View All Feedback
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              Have an idea? <Link href="/feedback" className="text-blue-400 hover:underline">Submit your feedback</Link>
            </p>
            <Link href="/" className="text-slate-500 text-sm hover:text-white">
              ← Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
