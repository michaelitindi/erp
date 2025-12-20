'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { voteFeedback, addReply, updateFeedbackStatus, toggleFeedbackPin, deleteFeedback } from '@/app/actions/feedback'
import { ArrowUp, Loader2, Pin, Trash2, MoreVertical } from 'lucide-react'

// Vote Button Component
export function VoteButton({ feedbackId, initialVotes }: { feedbackId: string; initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleVote() {
    let email = localStorage.getItem('feedback_email')
    if (!email) {
      email = prompt('Enter your email to vote:')
      if (!email || !email.includes('@')) return
      localStorage.setItem('feedback_email', email)
    }

    setIsLoading(true)
    try {
      const result = await voteFeedback(feedbackId, email)
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
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={isLoading}
      className={`w-full flex flex-col items-center justify-center p-6 rounded-lg border transition-all ${
        hasVoted
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400'
      }`}
    >
      <ArrowUp className={`h-8 w-8 ${isLoading ? 'animate-pulse' : ''}`} />
      <span className="text-3xl font-bold mt-2">{votes}</span>
      <span className="text-sm mt-1">{hasVoted ? 'Voted!' : 'Upvote'}</span>
    </button>
  )
}

// Reply Form Component
export function ReplyForm({ feedbackId }: { feedbackId: string }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    setError('')

    try {
      await addReply({ feedbackId, content })
      setContent('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        rows={3}
        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Reply'
          )}
        </button>
      </div>
    </form>
  )
}

// Status Selector Component
const statuses = [
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'PLANNED', label: 'Planned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'DECLINED', label: 'Declined' },
]

export function StatusSelector({ feedbackId, currentStatus }: { feedbackId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleChange(newStatus: string) {
    if (newStatus === status) return
    
    setIsLoading(true)
    try {
      await updateFeedbackStatus(feedbackId, newStatus)
      setStatus(newStatus)
      router.refresh()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isLoading}
      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
    >
      {statuses.map(s => (
        <option key={s.key} value={s.key}>{s.label}</option>
      ))}
    </select>
  )
}

// Admin Actions Component
export function AdminActions({ feedbackId, isPinned }: { feedbackId: string; isPinned: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handlePin() {
    setIsLoading(true)
    try {
      await toggleFeedbackPin(feedbackId)
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this feedback?')) return
    
    setIsLoading(true)
    try {
      await deleteFeedback(feedbackId)
      router.push('/feedback')
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden">
            <button
              onClick={handlePin}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Pin className="h-4 w-4" />
              {isPinned ? 'Unpin' : 'Pin to Top'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
