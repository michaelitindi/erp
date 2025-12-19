'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDocument } from '@/app/actions/documents'
import { Plus, X } from 'lucide-react'

export function UploadDocumentButton() {
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
      // In a real app, you'd upload to S3/cloud storage and get the path back
      // For demo purposes, we're just storing the metadata
      await createDocument({
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        fileName: formData.get('fileName') as string,
        fileType: (formData.get('fileName') as string).split('.').pop() || 'unknown',
        fileSize: parseInt(formData.get('fileSize') as string) || 0,
        filePath: `/uploads/${Date.now()}-${formData.get('fileName')}`,
        category: formData.get('category') as 'CONTRACT' | 'INVOICE' | 'REPORT' | 'POLICY' | 'OTHER' || null,
        tags: formData.get('tags') as string || null,
      })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
        <Plus className="h-4 w-4" />Upload Document
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Upload Document</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input name="title" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">File Name *</label>
                <input name="fileName" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="document.pdf" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">File Size (bytes)</label>
                  <input name="fileSize" type="number" min="0" defaultValue="0" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select name="category" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select...</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="REPORT">Report</option>
                    <option value="POLICY">Policy</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                <input name="tags" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="legal, contract, 2024" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
