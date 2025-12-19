'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBudget, updateBudgetStatus } from '@/app/actions/budgets'
import { Trash2, PlayCircle, StopCircle } from 'lucide-react'

interface Budget {
  id: string
  name: string
  fiscalYear: number
  startDate: Date
  endDate: Date
  totalAmount: number | { toNumber: () => number }
  status: string
  _count?: { lineItems: number }
}

const getAmount = (amt: number | { toNumber: () => number }): number => typeof amt === 'number' ? amt : amt?.toNumber?.() || 0

export function BudgetsTable({ budgets }: { budgets: Budget[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const statusColors: Record<string, string> = {
    DRAFT: 'text-slate-400 bg-slate-400/10',
    ACTIVE: 'text-green-400 bg-green-400/10',
    CLOSED: 'text-red-400 bg-red-400/10',
  }

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateBudgetStatus(id, status); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return
    setProcessingId(id)
    try { await deleteBudget(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Budget</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Year</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Period</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Total</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Accounts</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {budgets.map((budget) => (
            <tr key={budget.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4"><span className="text-sm font-medium text-white">{budget.name}</span></td>
              <td className="px-6 py-4 text-center"><span className="text-sm text-slate-300">{budget.fiscalYear}</span></td>
              <td className="px-6 py-4">
                <span className="text-sm text-slate-300">
                  {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                </span>
              </td>
              <td className="px-6 py-4 text-right"><span className="text-sm text-white font-mono">${getAmount(budget.totalAmount).toLocaleString()}</span></td>
              <td className="px-6 py-4 text-center"><span className="text-sm text-slate-300">{budget._count?.lineItems || 0}</span></td>
              <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[budget.status]}`}>{budget.status}</span></td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  {budget.status === 'DRAFT' && (
                    <button onClick={() => handleStatusChange(budget.id, 'ACTIVE')} disabled={processingId === budget.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50" title="Activate">
                      <PlayCircle className="h-4 w-4" />
                    </button>
                  )}
                  {budget.status === 'ACTIVE' && (
                    <button onClick={() => handleStatusChange(budget.id, 'CLOSED')} disabled={processingId === budget.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Close">
                      <StopCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(budget.id)} disabled={processingId === budget.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
