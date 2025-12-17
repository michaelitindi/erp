'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPayment } from '@/app/actions/payments'
import { Plus, X } from 'lucide-react'

interface Invoice { id: string; invoiceNumber: string; totalAmount: number | { toNumber: () => number }; customer: { companyName: string } }
interface Bill { id: string; billNumber: string; totalAmount: number | { toNumber: () => number }; vendor: { companyName: string } }

const getAmount = (amt: number | { toNumber: () => number }): number => typeof amt === 'number' ? amt : amt?.toNumber?.() || 0

export function CreatePaymentButton({ invoices, bills }: { invoices: Invoice[]; bills: Bill[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentType, setPaymentType] = useState<'received' | 'made'>('received')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createPayment({
        paymentDate: new Date(formData.get('paymentDate') as string),
        amount: parseFloat(formData.get('amount') as string),
        paymentMethod: formData.get('paymentMethod') as 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'BANK_TRANSFER',
        referenceNumber: formData.get('referenceNumber') as string || null,
        notes: formData.get('notes') as string || null,
        invoiceId: paymentType === 'received' ? formData.get('invoiceId') as string : null,
        billId: paymentType === 'made' ? formData.get('billId') as string : null,
      })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment')
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
        <Plus className="h-4 w-4" />Record Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Record Payment</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-700 rounded-lg">
                <button type="button" onClick={() => setPaymentType('received')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${paymentType === 'received' ? 'bg-green-600 text-white' : 'text-slate-300 hover:text-white'}`}>Payment Received</button>
                <button type="button" onClick={() => setPaymentType('made')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${paymentType === 'made' ? 'bg-red-600 text-white' : 'text-slate-300 hover:text-white'}`}>Payment Made</button>
              </div>

              {paymentType === 'received' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Invoice</label>
                  <select name="invoiceId" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select invoice...</option>
                    {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customer.companyName} (${getAmount(inv.totalAmount).toFixed(2)})</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Bill</label>
                  <select name="billId" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select bill...</option>
                    {bills.map(bill => <option key={bill.id} value={bill.id}>{bill.billNumber} - {bill.vendor.companyName} (${getAmount(bill.totalAmount).toFixed(2)})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Amount *</label>
                  <input name="amount" type="number" step="0.01" min="0.01" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date *</label>
                  <input name="paymentDate" type="date" required defaultValue={today} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Method *</label>
                  <select name="paymentMethod" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CHECK">Check</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Reference #</label>
                  <input name="referenceNumber" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none" placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none" placeholder="Optional notes..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
