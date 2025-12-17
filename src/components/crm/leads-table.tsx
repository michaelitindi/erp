'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLead, updateLeadStatus, convertLeadToCustomer } from '@/app/actions/leads'
import { Trash2, UserCheck, PhoneCall, CheckCircle } from 'lucide-react'

interface Lead {
  id: string
  leadNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  companyName: string | null
  source: string
  status: string
  rating: string | null
  estimatedValue: number | { toNumber: () => number } | null
  _count?: { activities: number }
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const getAmount = (amt: number | { toNumber: () => number } | null): number => {
    if (amt === null) return 0
    if (typeof amt === 'number') return amt
    if (typeof amt.toNumber === 'function') return amt.toNumber()
    return 0
  }

  const statusColors: Record<string, string> = {
    NEW: 'text-blue-400 bg-blue-400/10',
    CONTACTED: 'text-yellow-400 bg-yellow-400/10',
    QUALIFIED: 'text-green-400 bg-green-400/10',
    UNQUALIFIED: 'text-slate-400 bg-slate-400/10',
    CONVERTED: 'text-purple-400 bg-purple-400/10',
  }

  const ratingIcons: Record<string, string> = {
    HOT: '🔥',
    WARM: '☀️',
    COLD: '❄️',
  }

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateLeadStatus(id, status); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to update') }
    finally { setProcessingId(null) }
  }

  async function handleConvert(id: string) {
    if (!confirm('Convert this lead to a customer?')) return
    setProcessingId(id)
    try { await convertLeadToCustomer(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to convert') }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead?')) return
    setProcessingId(id)
    try { await deleteLead(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete') }
    finally { setProcessingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Lead</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Source</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Rating</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Est. Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-white">{lead.firstName} {lead.lastName}</p>
                <p className="text-xs text-slate-400 font-mono">{lead.leadNumber}</p>
                {lead.companyName && <p className="text-xs text-slate-500">{lead.companyName}</p>}
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-slate-300">{lead.email}</p>
                {lead.phone && <p className="text-xs text-slate-400">{lead.phone}</p>}
              </td>
              <td className="px-6 py-4"><span className="text-sm text-slate-300">{lead.source.replace('_', ' ')}</span></td>
              <td className="px-6 py-4 text-center"><span className="text-lg">{lead.rating ? ratingIcons[lead.rating] : '—'}</span></td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm text-white font-mono">{getAmount(lead.estimatedValue) > 0 ? `$${getAmount(lead.estimatedValue).toLocaleString()}` : '—'}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>{lead.status}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  {lead.status === 'NEW' && (
                    <button onClick={() => handleStatusChange(lead.id, 'CONTACTED')} disabled={processingId === lead.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 transition-colors disabled:opacity-50" title="Mark Contacted">
                      <PhoneCall className="h-4 w-4" />
                    </button>
                  )}
                  {lead.status === 'CONTACTED' && (
                    <button onClick={() => handleStatusChange(lead.id, 'QUALIFIED')} disabled={processingId === lead.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50" title="Mark Qualified">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {lead.status === 'QUALIFIED' && (
                    <button onClick={() => handleConvert(lead.id)} disabled={processingId === lead.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-600/20 hover:text-purple-400 transition-colors disabled:opacity-50" title="Convert to Customer">
                      <UserCheck className="h-4 w-4" />
                    </button>
                  )}
                  {lead.status !== 'CONVERTED' && (
                    <button onClick={() => handleDelete(lead.id)} disabled={processingId === lead.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
