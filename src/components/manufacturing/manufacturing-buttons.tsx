'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBOM, createWorkOrder, updateBOMStatus, updateWorkOrderStatus } from '@/app/actions/manufacturing'
import { Plus, X, Trash2 } from 'lucide-react'

interface Product { id: string; name: string; sku: string }
interface BOM { id: string; bomNumber: string; name: string; status: string }

interface BOMComponent {
  description: string
  productId: string | null
  quantity: number
  unit: string
  wastagePercent: number
}

export function CreateBOMButton({ products }: { products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [components, setComponents] = useState<BOMComponent[]>([{ description: '', productId: null, quantity: 1, unit: 'EACH', wastagePercent: 0 }])
  const router = useRouter()

  const addComponent = () => setComponents([...components, { description: '', productId: null, quantity: 1, unit: 'EACH', wastagePercent: 0 }])
  const removeComponent = (i: number) => components.length > 1 && setComponents(components.filter((_, idx) => idx !== i))
  const updateComponent = (i: number, field: keyof BOMComponent, value: string | number | null) => {
    const updated = [...components]
    updated[i] = { ...updated[i], [field]: value }
    setComponents(updated)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createBOM({
        name: formData.get('name') as string,
        productId: formData.get('productId') as string,
        notes: formData.get('notes') as string || null,
        components: components.filter(c => c.description && c.quantity > 0),
      })
      setIsOpen(false)
      setComponents([{ description: '', productId: null, quantity: 1, unit: 'EACH', wastagePercent: 0 }])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create BOM')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} disabled={products.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
        <Plus className="h-4 w-4" />Create BOM
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create Bill of Materials</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">BOM Name *</label>
                  <input name="name" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Finished Product *</label>
                  <select name="productId" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select Product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Components</label>
                  <button type="button" onClick={addComponent} className="text-xs text-blue-400 hover:text-blue-300">+ Add Component</button>
                </div>
                <div className="space-y-2">
                  {components.map((comp, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input placeholder="Description *" value={comp.description} onChange={e => updateComponent(i, 'description', e.target.value)} className="col-span-5 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      <input type="number" min="0.01" step="0.01" placeholder="Qty" value={comp.quantity} onChange={e => updateComponent(i, 'quantity', parseFloat(e.target.value) || 0)} className="col-span-2 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      <select value={comp.unit} onChange={e => updateComponent(i, 'unit', e.target.value)} className="col-span-2 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                        <option value="EACH">Each</option>
                        <option value="KG">KG</option>
                        <option value="L">Liters</option>
                        <option value="M">Meters</option>
                      </select>
                      <input type="number" min="0" max="100" step="0.1" placeholder="Waste%" value={comp.wastagePercent} onChange={e => updateComponent(i, 'wastagePercent', parseFloat(e.target.value) || 0)} className="col-span-2 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      <button type="button" onClick={() => removeComponent(i)} className="col-span-1 p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Creating...' : 'Create BOM'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function CreateWorkOrderButton({ boms }: { boms: BOM[] }) {
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
      await createWorkOrder({
        bomId: formData.get('bomId') as string || null,
        quantity: parseFloat(formData.get('quantity') as string),
        priority: formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        plannedStart: formData.get('plannedStart') ? new Date(formData.get('plannedStart') as string) : null,
        plannedEnd: formData.get('plannedEnd') ? new Date(formData.get('plannedEnd') as string) : null,
        notes: formData.get('notes') as string || null,
      })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create work order')
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
        <Plus className="h-4 w-4" />New Work Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create Work Order</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bill of Materials</label>
                <select name="bomId" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                  <option value="">Select BOM (or leave for manual order)</option>
                  {boms.filter(b => b.status === 'ACTIVE').map(b => <option key={b.id} value={b.id}>{b.bomNumber} - {b.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Quantity *</label>
                  <input name="quantity" type="number" min="1" step="1" required defaultValue="1" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                  <select name="priority" defaultValue="MEDIUM" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Planned Start</label>
                  <input name="plannedStart" type="date" defaultValue={today} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Planned End</label>
                  <input name="plannedEnd" type="date" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50">{isLoading ? 'Creating...' : 'Create Work Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
