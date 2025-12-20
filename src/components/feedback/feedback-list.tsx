'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUp, MessageSquare, Pin, CheckCircle, Clock, PlayCircle, XCircle, Lightbulb, Bug, Zap, HelpCircle } from 'lucide-react'
import { voteFeedback } from '@/app/actions/feedback'

interface FeedbackItem {
  id: string
  title: string
  description: string
  category: string
  status: string
  voteCount: number
  isPinned: boolean
  authorName: string
  createdAt: Date
  _count: { replies: number }
}

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

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <FeedbackCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [votes, setVotes] = useState(item.voteCount)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const CategoryIcon = categoryIcons[item.category] || Lightbulb
  const status = statusInfo[item.status] || statusInfo.UNDER_REVIEW
  const StatusIcon = status.icon

  async function handleVote() {
    // Get email from localStorage or prompt
    let email = localStorage.getItem('feedback_email')
    if (!email) {
      email = prompt('Enter your email to vote:')
      if (!email || !email.includes('@')) return
      localStorage.setItem('feedback_email', email)
    }

    setIsVoting(true)
    try {
      const result = await voteFeedback(item.id, email)
      if (result.voted) {
        setVotes(v => v + 1)
        setHasVoted(true)
      } else {
        setVotes(v => v - 1)
        setHasVoted(false)
      }
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="group relative flex gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
      {/* Vote Button */}
      <button
        onClick={handleVote}
        disabled={isVoting}
        className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border transition-all flex-shrink-0 ${
          hasVoted
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400'
        }`}
      >
        <ArrowUp className={`h-5 w-5 ${isVoting ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-bold">{votes}</span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          {item.isPinned && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${categoryColors[item.category]}`}>
            <CategoryIcon className="h-3 w-3" />
            {item.category.charAt(0) + item.category.slice(1).toLowerCase()}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>
        
        <Link href={`/feedback/${item.id}`} className="block mt-2">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
        </Link>

        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
          <span>{item.authorName}</span>
          <span>•</span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          {item._count.replies > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {item._count.replies} {item._count.replies === 1 ? 'reply' : 'replies'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
