'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBudget } from '@/app/actions/budgets'
import { Plus, X, Trash2 } from 'lucide-react'

interface Account { id: string; accountName: string; accountNumber: string; accountType: string }
interface LineItem { accountId: string; amount: number; period: string }

export function CreateBudgetButton({ accounts }: { accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ accountId: '', amount: 0, period: 'ANNUAL' }])
  const router = useRouter()

  const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE')
  
  const addLine = () => setLineItems([...lineItems, { accountId: '', amount: 0, period: 'ANNUAL' }])
  const removeLine = (i: number) => lineItems.length > 1 && setLineItems(lineItems.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[i] = { ...updated[i], [field]: value }
    setLineItems(updated)
  }

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createBudget({
        name: formData.get('name') as string,
        fiscalYear: parseInt(formData.get('fiscalYear') as string),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        lineItems: lineItems.filter(li => li.accountId && li.amount > 0).map(li => ({
          accountId: li.accountId,
          amount: li.amount,
          period: li.period as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
        })),
      })
      setIsOpen(false)
      setLineItems([{ accountId: '', amount: 0, period: 'ANNUAL' }])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget')
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <>
      <button onClick={() => setIsOpen(true)} disabled={expenseAccounts.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
        <Plus className="h-4 w-4" />New Budget
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create Budget</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Budget Name *</label>
                  <input name="name" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="Operating Budget 2025" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fiscal Year *</label>
                  <input name="fiscalYear" type="number" min="2020" max="2100" required defaultValue={currentYear} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start Date *</label>
                  <input name="startDate" type="date" required defaultValue={`${currentYear}-01-01`} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End Date *</label>
                  <input name="endDate" type="date" required defaultValue={`${currentYear}-12-31`} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Budget Line Items</label>
                  <button type="button" onClick={addLine} className="text-xs text-blue-400 hover:text-blue-300">+ Add Account</button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select value={item.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)} className="col-span-6 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                        <option value="">Select Account...</option>
                        {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} - {a.accountName}</option>)}
                      </select>
                      <input type="number" min="0" step="0.01" placeholder="Amount" value={item.amount} onChange={e => updateLine(i, 'amount', parseFloat(e.target.value) || 0)} className="col-span-3 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      <select value={item.period} onChange={e => updateLine(i, 'period', e.target.value)} className="col-span-2 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                        <option value="ANNUAL">Annual</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                      <button type="button" onClick={() => removeLine(i)} className="col-span-1 p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end text-sm text-slate-300 bg-slate-700/50 p-3 rounded-lg">
                <span>Total Budget: <strong className="text-green-400 text-lg">${total.toLocaleString()}</strong></span>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Creating...' : 'Create Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
