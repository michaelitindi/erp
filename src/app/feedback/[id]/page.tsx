import { getFeedbackById } from '@/app/actions/feedback'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, MessageSquare, Pin, CheckCircle, Clock, PlayCircle, XCircle, Lightbulb, Bug, Zap, HelpCircle, User } from 'lucide-react'
import { VoteButton, ReplyForm, StatusSelector, AdminActions } from '@/components/feedback/feedback-detail-components'
import { auth } from '@clerk/nextjs/server'

const categoryIcons: Record<string, typeof Lightbulb> = {
  FEATURE: Lightbulb,
  BUG: Bug,
  IMPROVEMENT: Zap,
  QUESTION: HelpCircle,
}

const categoryColors: Record<string, string> = {
  FEATURE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  BUG: 'text-red-400 bg-red-500/10 border-red-500/20',
  IMPROVEMENT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  QUESTION: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}

const statusInfo: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  UNDER_REVIEW: { label: 'Under Review', color: 'text-yellow-400 bg-yellow-500/10', icon: Clock },
  PLANNED: { label: 'Planned', color: 'text-blue-400 bg-blue-500/10', icon: CheckCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-400 bg-purple-500/10', icon: PlayCircle },
  COMPLETED: { label: 'Completed', color: 'text-green-400 bg-green-500/10', icon: CheckCircle },
  DECLINED: { label: 'Declined', color: 'text-slate-400 bg-slate-500/10', icon: XCircle },
}

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const feedback = await getFeedbackById(id)
  
  if (!feedback) notFound()

  const { userId } = await auth()
  const CategoryIcon = categoryIcons[feedback.category] || Lightbulb
  const status = statusInfo[feedback.status] || statusInfo.UNDER_REVIEW
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/feedback" className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Feedback</span>
            </Link>
            {userId && <AdminActions feedbackId={feedback.id} isPinned={feedback.isPinned} />}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Main Content */}
          <div>
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {feedback.isPinned && (
                <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${categoryColors[feedback.category]}`}>
                <CategoryIcon className="h-3 w-3" />
                {feedback.category.charAt(0) + feedback.category.slice(1).toLowerCase()}
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{feedback.title}</h1>

            {/* Author & Date */}
            <div className="flex items-center gap-3 mb-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-white font-medium">{feedback.authorName}</span>
              </div>
              <span>•</span>
              <span>{new Date(feedback.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.description}</p>
            </div>

            {/* Replies Section */}
            <div className="border-t border-slate-700 pt-8">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {feedback._count.replies} {feedback._count.replies === 1 ? 'Reply' : 'Replies'}
              </h2>

              {feedback.replies.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {feedback.replies.map(reply => (
                    <div key={reply.id} className={`p-4 rounded-lg ${reply.isOfficial ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-800/50 border border-slate-700'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="h-3 w-3 text-slate-400" />
                        </div>
                        <span className="font-medium text-white text-sm">{reply.authorName}</span>
                        {reply.isOfficial && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                            Team
                          </span>
                        )}
                        <span className="text-slate-500 text-xs">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 mb-8">No replies yet. Be the first to comment!</p>
              )}

              {/* Reply Form */}
              {userId ? (
                <ReplyForm feedbackId={feedback.id} />
              ) : (
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 text-center">
                  <p className="text-slate-400 mb-3">Sign in to leave a reply</p>
                  <Link href="/sign-in" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vote Card */}
            <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/50">
              <VoteButton feedbackId={feedback.id} initialVotes={feedback.voteCount} />
              <p className="text-center text-slate-400 text-sm mt-3">
                Vote to show your support
              </p>
            </div>

            {/* Status (Admin Only) */}
            {userId && (
              <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/50">
                <h3 className="text-sm font-semibold text-white mb-4">Update Status</h3>
                <StatusSelector feedbackId={feedback.id} currentStatus={feedback.status} />
              </div>
            )}

            {/* Stats */}
            <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/50">
              <h3 className="text-sm font-semibold text-white mb-4">Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Votes</span>
                  <span className="text-white font-medium">{feedback.voteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Replies</span>
                  <span className="text-white font-medium">{feedback._count.replies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-white">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
