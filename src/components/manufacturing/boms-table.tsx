'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBOMStatus } from '@/app/actions/manufacturing'
import { CheckCircle, XCircle } from 'lucide-react'

interface BOM {
  id: string
  bomNumber: string
  name: string
  status: string
  _count?: { components: number; workOrders: number }
}

export function BOMsTable({ boms }: { boms: BOM[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateBOMStatus(id, status); router.refresh() }
    catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'text-slate-400 bg-slate-400/10',
    ACTIVE: 'text-green-400 bg-green-400/10',
    OBSOLETE: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="space-y-3">
      {boms.slice(0, 10).map(bom => (
        <div key={bom.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
          <div>
            <p className="text-sm font-medium text-white">{bom.name}</p>
            <p className="text-xs text-slate-400 font-mono">{bom.bomNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{bom._count?.components || 0} components</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[bom.status]}`}>{bom.status}</span>
            <div className="flex gap-1">
              {bom.status === 'DRAFT' && (
                <button onClick={() => handleStatusChange(bom.id, 'ACTIVE')} disabled={processingId === bom.id} className="p-1 text-slate-400 hover:text-green-400 disabled:opacity-50" title="Activate">
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              {bom.status === 'ACTIVE' && (
                <button onClick={() => handleStatusChange(bom.id, 'OBSOLETE')} disabled={processingId === bom.id} className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50" title="Mark Obsolete">
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
