import { getPayments } from '@/app/actions/payments'
import { getInvoices } from '@/app/actions/invoices'
import { getBills } from '@/app/actions/bills'
import { PaymentsTable } from '@/components/finance/payments-table'
import { CreatePaymentButton } from '@/components/finance/payment-buttons'
import { CreditCard, ArrowDownCircle, ArrowUpCircle, DollarSign } from 'lucide-react'

export default async function PaymentsPage() {
  const [payments, invoices, bills] = await Promise.all([
    getPayments(),
    getInvoices(),
    getBills()
  ])

  // Filter unpaid invoices and bills for the create payment modal
  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'VOID')
  const unpaidBills = bills.filter(b => b.status !== 'PAID' && b.status !== 'VOID')

  const stats = {
    total: payments.length,
    received: payments.filter(p => p.invoice).length,
    made: payments.filter(p => p.bill).length,
    totalReceived: payments.filter(p => p.invoice).reduce((sum, p) => sum + Number(p.amount), 0),
    totalPaid: payments.filter(p => p.bill).reduce((sum, p) => sum + Number(p.amount), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-slate-400">Track payments received and made</p>
        </div>
        <CreatePaymentButton invoices={unpaidInvoices} bills={unpaidBills} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><CreditCard className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Total Payments</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><ArrowDownCircle className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Received</p><p className="text-2xl font-bold text-white">${stats.totalReceived.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2"><ArrowUpCircle className="h-5 w-5 text-red-400" /></div>
            <div><p className="text-sm text-slate-400">Paid Out</p><p className="text-2xl font-bold text-white">${stats.totalPaid.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><DollarSign className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Net Cash Flow</p><p className="text-2xl font-bold text-white">${(stats.totalReceived - stats.totalPaid).toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No payments recorded</h3>
          <p className="mt-2 text-slate-400">Record your first payment to start tracking cash flow.</p>
          <div className="mt-6"><CreatePaymentButton invoices={unpaidInvoices} bills={unpaidBills} /></div>
        </div>
      ) : (
        <PaymentsTable payments={payments} />
      )}
    </div>
  )
}
