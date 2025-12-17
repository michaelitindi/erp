import { getInvoices } from '@/app/actions/invoices'
import { getCustomers } from '@/app/actions/customers'
import { InvoicesTable } from '@/components/finance/invoices-table'
import { CreateInvoiceButton } from '@/components/finance/invoice-buttons'
import { Receipt, DollarSign, Clock, CheckCircle } from 'lucide-react'

export default async function InvoicesPage() {
  const [invoices, customers] = await Promise.all([
    getInvoices(),
    getCustomers()
  ])

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'DRAFT').length,
    sent: invoices.filter(i => i.status === 'SENT').length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
    paidAmount: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.totalAmount), 0),
    pendingAmount: invoices.filter(i => ['DRAFT', 'SENT', 'OVERDUE'].includes(i.status)).reduce((sum, i) => sum + Number(i.totalAmount), 0),
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400">Manage your accounts receivable</p>
        </div>
        <CreateInvoiceButton customers={customers} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Receipt className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Invoices</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Amount</p>
              <p className="text-2xl font-bold text-white">${stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-white">${stats.pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Paid</p>
              <p className="text-2xl font-bold text-white">${stats.paidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No invoices yet</h3>
          <p className="mt-2 text-slate-400">
            Create your first invoice to start tracking revenue.
          </p>
          <div className="mt-6">
            <CreateInvoiceButton customers={customers} />
          </div>
        </div>
      ) : (
        <InvoicesTable invoices={invoices} />
      )}
    </div>
  )
}
