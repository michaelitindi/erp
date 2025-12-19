'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWorkOrderStatus } from '@/app/actions/manufacturing'
import { PlayCircle, CheckCircle, XCircle } from 'lucide-react'

interface WorkOrder {
  id: string
  workOrderNumber: string
  status: string
  priority: string
  quantity: number | { toNumber: () => number }
  bom?: { bomNumber: string; name: string } | null
}

const getQty = (qty: number | { toNumber: () => number }): number => typeof qty === 'number' ? qty : qty?.toNumber?.() || 0

export function WorkOrdersTable({ workOrders }: { workOrders: WorkOrder[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateWorkOrderStatus(id, status); router.refresh() }
    catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  const statusColors: Record<string, string> = {
    PLANNED: 'text-slate-400 bg-slate-400/10',
    IN_PROGRESS: 'text-blue-400 bg-blue-400/10',
    COMPLETED: 'text-green-400 bg-green-400/10',
    CANCELLED: 'text-red-400 bg-red-400/10',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'text-slate-400',
    MEDIUM: 'text-blue-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  }

  return (
    <div className="space-y-3">
      {workOrders.slice(0, 10).map(wo => (
        <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
          <div>
            <p className="text-sm font-medium text-white font-mono">{wo.workOrderNumber}</p>
            <p className="text-xs text-slate-400">{wo.bom?.name || 'Manual Order'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${priorityColors[wo.priority]}`}>{wo.priority}</span>
            <span className="text-xs text-slate-400">Qty: {getQty(wo.quantity)}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[wo.status]}`}>{wo.status.replace('_', ' ')}</span>
            <div className="flex gap-1">
              {wo.status === 'PLANNED' && (
                <button onClick={() => handleStatusChange(wo.id, 'IN_PROGRESS')} disabled={processingId === wo.id} className="p-1 text-slate-400 hover:text-blue-400 disabled:opacity-50" title="Start">
                  <PlayCircle className="h-4 w-4" />
                </button>
              )}
              {wo.status === 'IN_PROGRESS' && (
                <button onClick={() => handleStatusChange(wo.id, 'COMPLETED')} disabled={processingId === wo.id} className="p-1 text-slate-400 hover:text-green-400 disabled:opacity-50" title="Complete">
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              {(wo.status === 'PLANNED' || wo.status === 'IN_PROGRESS') && (
                <button onClick={() => handleStatusChange(wo.id, 'CANCELLED')} disabled={processingId === wo.id} className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50" title="Cancel">
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
