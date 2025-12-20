import { getFeedback, getFeedbackStats } from '@/app/actions/feedback'
import { Suspense } from 'react'
import Link from 'next/link'
import { MessageSquare, Lightbulb, Bug, Zap, HelpCircle, ArrowUp, ChevronRight, Search, Pin, CheckCircle, Clock, PlayCircle, XCircle } from 'lucide-react'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { SubmitFeedbackButton } from '@/components/feedback/feedback-buttons'

const categoryIcons: Record<string, typeof Lightbulb> = {
  FEATURE: Lightbulb,
  BUG: Bug,
  IMPROVEMENT: Zap,
  QUESTION: HelpCircle,
}

const statusColors: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  UNDER_REVIEW: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
  PLANNED: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle },
  IN_PROGRESS: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: PlayCircle },
  COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
  DECLINED: { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: XCircle },
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; sort?: string; search?: string }>
}) {
  const params = await searchParams
  const category = params.category || 'ALL'
  const status = params.status || 'ALL'
  const sort = (params.sort || 'votes') as 'votes' | 'newest' | 'oldest'
  const search = params.search || ''

  const [{ items, total }, stats] = await Promise.all([
    getFeedback({ category: category !== 'ALL' ? category : undefined, status: status !== 'ALL' ? status : undefined, sort, search: search || undefined }),
    getFeedbackStats(),
  ])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Feedback</span>
            </Link>
            <SubmitFeedbackButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Help us build what you need
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Share your ideas, report bugs, and vote on features. Your feedback shapes our roadmap.
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-slate-400">total ideas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">{stats.byStatus?.COMPLETED || 0}</span>
              <span className="text-slate-400">completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-400">{stats.byStatus?.IN_PROGRESS || 0}</span>
              <span className="text-slate-400">in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">{stats.byStatus?.PLANNED || 0}</span>
              <span className="text-slate-400">planned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <form>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search feedback..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </form>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'FEATURE', 'BUG', 'IMPROVEMENT', 'QUESTION'].map(cat => (
              <Link
                key={cat}
                href={`/feedback?category=${cat}&status=${status}&sort=${sort}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-400">
            Showing {items.length} of {total} results
          </p>
          <div className="flex gap-2">
            {[
              { key: 'votes', label: 'Top Voted' },
              { key: 'newest', label: 'Newest' },
              { key: 'oldest', label: 'Oldest' },
            ].map(s => (
              <Link
                key={s.key}
                href={`/feedback?category=${category}&status=${status}&sort=${s.key}`}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  sort === s.key
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <Suspense fallback={<div className="text-center py-8 text-slate-400">Loading...</div>}>
          <FeedbackList items={items} />
        </Suspense>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No feedback yet</h3>
            <p className="text-slate-400 mb-6">Be the first to share your idea!</p>
            <SubmitFeedbackButton />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-500 text-sm">
            Have an idea? Submit your feedback and help us improve.
          </p>
        </div>
      </footer>
    </div>
  )
}
