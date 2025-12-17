'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBill, updateBillStatus } from '@/app/actions/bills'
import { Trash2, Eye, CheckCircle, FileCheck } from 'lucide-react'

interface Bill {
  id: string
  billNumber: string
  billDate: Date
  dueDate: Date
  totalAmount: number | { toNumber: () => number }
  paidAmount: number | { toNumber: () => number }
  status: string
  vendor: { companyName: string; email: string }
}

export function BillsTable({ bills }: { bills: Bill[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const statusColors: Record<string, string> = {
    DRAFT: 'text-slate-400 bg-slate-400/10',
    APPROVED: 'text-blue-400 bg-blue-400/10',
    PAID: 'text-green-400 bg-green-400/10',
    OVERDUE: 'text-red-400 bg-red-400/10',
    VOID: 'text-slate-500 bg-slate-500/10',
  }

  const getAmount = (amount: number | { toNumber: () => number }): number => {
    if (typeof amount === 'number') return amount
    if (amount && typeof amount.toNumber === 'function') return amount.toNumber()
    return 0
  }

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateBillStatus(id, status); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to update bill') }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this bill?')) return
    setProcessingId(id)
    try { await deleteBill(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete bill') }
    finally { setProcessingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Bill #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vendor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Due Date</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {bills.map((bill) => (
            <tr key={bill.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4"><span className="font-mono text-sm text-white">{bill.billNumber}</span></td>
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-white">{bill.vendor.companyName}</p>
                <p className="text-xs text-slate-400">{bill.vendor.email}</p>
              </td>
              <td className="px-6 py-4"><span className="text-sm text-slate-300">{new Date(bill.billDate).toLocaleDateString()}</span></td>
              <td className="px-6 py-4"><span className="text-sm text-slate-300">{new Date(bill.dueDate).toLocaleDateString()}</span></td>
              <td className="px-6 py-4 text-right"><span className="text-sm text-white font-mono">${getAmount(bill.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
              <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[bill.status]}`}>{bill.status}</span></td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                  {bill.status === 'DRAFT' && <button onClick={() => handleStatusChange(bill.id, 'APPROVED')} disabled={processingId === bill.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 transition-colors disabled:opacity-50" title="Approve"><FileCheck className="h-4 w-4" /></button>}
                  {bill.status === 'APPROVED' && <button onClick={() => handleStatusChange(bill.id, 'PAID')} disabled={processingId === bill.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50" title="Mark Paid"><CheckCircle className="h-4 w-4" /></button>}
                  {bill.status !== 'PAID' && <button onClick={() => handleDelete(bill.id)} disabled={processingId === bill.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
