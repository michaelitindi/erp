'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteInvoice, updateInvoiceStatus } from '@/app/actions/invoices'
import { Trash2, Eye, Send, CheckCircle } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  totalAmount: number | { toNumber: () => number }
  paidAmount: number | { toNumber: () => number }
  status: string
  customer: { companyName: string; email: string }
  _count?: { lineItems: number; payments: number }
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const statusColors = {
    DRAFT: 'text-slate-400 bg-slate-400/10',
    SENT: 'text-blue-400 bg-blue-400/10',
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
    try {
      await updateInvoiceStatus(id, status)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update invoice')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    setProcessingId(id)
    try {
      await deleteInvoice(id)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Invoice #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-mono text-sm text-white">{invoice.invoiceNumber}</span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-white">{invoice.customer.companyName}</p>
                <p className="text-xs text-slate-400">{invoice.customer.email}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-300">
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-300">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm text-white font-mono">
                  ${getAmount(invoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end gap-1">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {invoice.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusChange(invoice.id, 'SENT')}
                      disabled={processingId === invoice.id}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 transition-colors disabled:opacity-50"
                      title="Mark as Sent"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  {invoice.status === 'SENT' && (
                    <button
                      onClick={() => handleStatusChange(invoice.id, 'PAID')}
                      disabled={processingId === invoice.id}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50"
                      title="Mark as Paid"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {invoice.status !== 'PAID' && (
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      disabled={processingId === invoice.id}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
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
