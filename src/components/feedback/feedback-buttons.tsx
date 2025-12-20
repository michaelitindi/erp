'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { submitFeedback } from '@/app/actions/feedback'
import { Plus, X, Lightbulb, Bug, Zap, HelpCircle, Loader2 } from 'lucide-react'

const categories = [
  { key: 'FEATURE', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature' },
  { key: 'BUG', label: 'Bug Report', icon: Bug, description: 'Report something broken' },
  { key: 'IMPROVEMENT', label: 'Improvement', icon: Zap, description: 'Enhance existing functionality' },
  { key: 'QUESTION', label: 'Question', icon: HelpCircle, description: 'Ask about the product' },
]

export function SubmitFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('FEATURE')
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Pre-fill email from localStorage for returning guests
  const [savedEmail, setSavedEmail] = useState('')
  const [savedName, setSavedName] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSavedEmail(localStorage.getItem('feedback_email') || '')
      setSavedName(localStorage.getItem('feedback_name') || '')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : formData.get('name') as string
    const email = user?.emailAddresses?.[0]?.emailAddress || formData.get('email') as string

    // Save for future submissions
    if (!user) {
      localStorage.setItem('feedback_email', email)
      localStorage.setItem('feedback_name', name)
    }

    try {
      await submitFeedback({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: selectedCategory as 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'QUESTION',
        authorName: name,
        authorEmail: email,
      })
      
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Submit Feedback
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Submit Feedback</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                          selectedCategory === cat.key
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                            : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 ${selectedCategory === cat.key ? 'text-blue-400' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-medium text-white text-sm">{cat.label}</p>
                          <p className="text-xs text-slate-400">{cat.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input
                  name="title"
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="Brief summary of your feedback"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description *</label>
                <textarea
                  name="description"
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={4}
                  placeholder="Describe your idea or issue in detail..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Author Info - Only show for guests */}
              {!user && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your Name *</label>
                    <input
                      name="name"
                      required
                      defaultValue={savedName}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={savedEmail}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {user && (
                <p className="text-sm text-slate-400">
                  Posting as <span className="text-white font-medium">{user.firstName} {user.lastName}</span>
                </p>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
