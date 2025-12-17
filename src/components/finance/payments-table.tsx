'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePayment } from '@/app/actions/payments'
import { Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface Payment {
  id: string
  paymentNumber: string
  paymentDate: Date
  amount: number | { toNumber: () => number }
  paymentMethod: string
  referenceNumber: string | null
  invoice?: { invoiceNumber: string; customer: { companyName: string } } | null
  bill?: { billNumber: string; vendor: { companyName: string } } | null
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const getAmount = (amt: number | { toNumber: () => number }): number => typeof amt === 'number' ? amt : amt?.toNumber?.() || 0

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this payment? This will reverse the payment on the linked invoice/bill.')) return
    setDeletingId(id)
    try { await deletePayment(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete payment') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Payment #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Related To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {payments.map((payment) => {
            const isReceived = !!payment.invoice
            return (
              <tr key={payment.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4"><span className="font-mono text-sm text-white">{payment.paymentNumber}</span></td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isReceived ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    {isReceived ? <><ArrowDownCircle className="h-3 w-3" />Received</> : <><ArrowUpCircle className="h-3 w-3" />Paid</>}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {payment.invoice && (
                    <div>
                      <p className="text-sm font-medium text-white">{payment.invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-400">{payment.invoice.customer.companyName}</p>
                    </div>
                  )}
                  {payment.bill && (
                    <div>
                      <p className="text-sm font-medium text-white">{payment.bill.billNumber}</p>
                      <p className="text-xs text-slate-400">{payment.bill.vendor.companyName}</p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4"><span className="text-sm text-slate-300">{new Date(payment.paymentDate).toLocaleDateString()}</span></td>
                <td className="px-6 py-4"><span className="text-sm text-slate-300">{payment.paymentMethod.replace('_', ' ')}</span></td>
                <td className="px-6 py-4 text-right"><span className={`text-sm font-mono ${isReceived ? 'text-green-400' : 'text-red-400'}`}>{isReceived ? '+' : '-'}${getAmount(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(payment.id)} disabled={deletingId === payment.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
