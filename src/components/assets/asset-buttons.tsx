'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAsset } from '@/app/actions/assets'
import { Plus, X } from 'lucide-react'

export function CreateAssetButton() {
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
      await createAsset({
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        category: formData.get('category') as 'EQUIPMENT' | 'VEHICLE' | 'FURNITURE' | 'IT' | 'BUILDING',
        location: formData.get('location') as string || null,
        purchaseDate: new Date(formData.get('purchaseDate') as string),
        purchasePrice: parseFloat(formData.get('purchasePrice') as string),
        salvageValue: parseFloat(formData.get('salvageValue') as string) || 0,
        usefulLifeMonths: parseInt(formData.get('usefulLifeMonths') as string) || 60,
        serialNumber: formData.get('serialNumber') as string || null,
        notes: formData.get('notes') as string || null,
      })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
        <Plus className="h-4 w-4" />Add Asset
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add Asset</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Asset Name *</label>
                  <input name="name" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                  <select name="category" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="IT">IT/Electronics</option>
                    <option value="BUILDING">Building</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                  <input name="location" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Purchase Date *</label>
                  <input name="purchaseDate" type="date" required defaultValue={today} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Purchase Price *</label>
                  <input name="purchasePrice" type="number" min="0" step="0.01" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Salvage Value</label>
                  <input name="salvageValue" type="number" min="0" step="0.01" defaultValue="0" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Useful Life (months)</label>
                  <input name="usefulLifeMonths" type="number" min="1" defaultValue="60" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Serial Number</label>
                  <input name="serialNumber" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <input name="description" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Adding...' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
