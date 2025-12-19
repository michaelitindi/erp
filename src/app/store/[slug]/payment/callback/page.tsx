import { verifyAndCompletePayment, getOrderById } from '@/app/actions/storefront'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function PaymentCallbackPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ orderId?: string; reference?: string; trxref?: string; transaction_id?: string; session_id?: string }>
}) {
  const { slug } = await params
  const { orderId, reference, trxref, transaction_id, session_id } = await searchParams
  
  if (!orderId) {
    redirect(`/store/${slug}`)
  }

  // Get the payment reference from various providers' callback params
  const paymentReference = reference || trxref || transaction_id || session_id

  // Verify payment
  let order
  try {
    order = await verifyAndCompletePayment(orderId, paymentReference || undefined)
  } catch (error) {
    // Order not found, redirect to store
    redirect(`/store/${slug}`)
  }

  if (!order) {
    redirect(`/store/${slug}`)
  }

  const isPaid = order.paymentStatus === 'PAID'
  const isFailed = order.paymentStatus === 'FAILED'
  const isPending = order.paymentStatus === 'PENDING'

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
      <div className="max-w-md w-full mx-4 text-center">
        {isPaid ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-slate-400 mb-6">Your order has been confirmed</p>
          </>
        ) : isFailed ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Failed</h1>
            <p className="text-slate-400 mb-6">There was an issue processing your payment</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Pending</h1>
            <p className="text-slate-400 mb-6">We're waiting for payment confirmation</p>
          </>
        )}

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 mb-6">
          <p className="text-sm text-slate-400 mb-1">Order Number</p>
          <p className="text-2xl font-mono font-bold text-white">{order.orderNumber}</p>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-white">${Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>

        {isPaid && (
          <p className="text-sm text-slate-400 mb-6">
            We've sent a confirmation to {order.customerEmail}
          </p>
        )}

        {isFailed && (
          <Link 
            href={`/store/${slug}/checkout`} 
            className="inline-flex items-center gap-2 px-6 py-3 mb-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Try Again
          </Link>
        )}

        <Link 
          href={`/store/${slug}`} 
          className="block px-6 py-3 rounded-lg border border-slate-600 text-white font-medium hover:bg-slate-800"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
