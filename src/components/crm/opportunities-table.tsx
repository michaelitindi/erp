'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteOpportunity, updateOpportunityStage } from '@/app/actions/opportunities'
import { Trash2, ArrowRight, Trophy, XCircle } from 'lucide-react'

interface Opportunity {
  id: string
  opportunityNumber: string
  name: string
  stage: string
  probability: number
  amount: number | { toNumber: () => number }
  expectedCloseDate: Date | null
  customer: { companyName: string }
  _count?: { activities: number }
}

const stageOrder = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']

export function OpportunitiesTable({ opportunities }: { opportunities: Opportunity[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const getAmount = (amt: number | { toNumber: () => number }): number => typeof amt === 'number' ? amt : amt?.toNumber?.() || 0

  const stageColors: Record<string, string> = {
    PROSPECTING: 'text-slate-400 bg-slate-400/10',
    QUALIFICATION: 'text-blue-400 bg-blue-400/10',
    PROPOSAL: 'text-purple-400 bg-purple-400/10',
    NEGOTIATION: 'text-orange-400 bg-orange-400/10',
    CLOSED_WON: 'text-green-400 bg-green-400/10',
    CLOSED_LOST: 'text-red-400 bg-red-400/10',
  }

  async function handleAdvanceStage(id: string, currentStage: string) {
    const currentIndex = stageOrder.indexOf(currentStage)
    if (currentIndex < 0 || currentIndex >= 3) return // Can't advance past Negotiation
    
    const nextStage = stageOrder[currentIndex + 1]
    setProcessingId(id)
    try { await updateOpportunityStage(id, nextStage); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to update') }
    finally { setProcessingId(null) }
  }

  async function handleWin(id: string) {
    if (!confirm('Mark this opportunity as Won?')) return
    setProcessingId(id)
    try { await updateOpportunityStage(id, 'CLOSED_WON'); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to update') }
    finally { setProcessingId(null) }
  }

  async function handleLose(id: string) {
    const reason = prompt('Reason for losing this opportunity?')
    if (reason === null) return
    setProcessingId(id)
    try { await updateOpportunityStage(id, 'CLOSED_LOST', reason); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to update') }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this opportunity?')) return
    setProcessingId(id)
    try { await deleteOpportunity(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete') }
    finally { setProcessingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Opportunity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Customer</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Probability</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Expected Close</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Stage</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {opportunities.map((opp) => {
            const isClosed = opp.stage.startsWith('CLOSED')
            const canAdvance = !isClosed && stageOrder.indexOf(opp.stage) < 4
            
            return (
              <tr key={opp.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">{opp.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{opp.opportunityNumber}</p>
                </td>
                <td className="px-6 py-4"><span className="text-sm text-slate-300">{opp.customer.companyName}</span></td>
                <td className="px-6 py-4 text-right"><span className="text-sm text-white font-mono">${getAmount(opp.amount).toLocaleString()}</span></td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-sm font-medium ${opp.probability >= 70 ? 'text-green-400' : opp.probability >= 40 ? 'text-yellow-400' : 'text-slate-400'}`}>{opp.probability}%</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">{opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '—'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stageColors[opp.stage]}`}>{opp.stage.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {canAdvance && (
                      <button onClick={() => handleAdvanceStage(opp.id, opp.stage)} disabled={processingId === opp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 transition-colors disabled:opacity-50" title="Advance Stage">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {!isClosed && (
                      <>
                        <button onClick={() => handleWin(opp.id)} disabled={processingId === opp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50" title="Mark Won">
                          <Trophy className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleLose(opp.id)} disabled={processingId === opp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Mark Lost">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(opp.id)} disabled={processingId === opp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
