import { getOrderByNumber, getPublicStore } from '@/app/actions/storefront'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, CheckCircle, Truck, Clock, XCircle, CreditCard, ArrowLeft } from 'lucide-react'

const statusSteps = [
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
]

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-blue-400',
  PROCESSING: 'text-purple-400',
  SHIPPED: 'text-orange-400',
  DELIVERED: 'text-green-400',
  CANCELLED: 'text-red-400',
}

export default async function OrderTrackingPage({ 
  params 
}: { 
  params: Promise<{ slug: string; orderNumber: string }>
}) {
  const { slug, orderNumber } = await params
  
  const [store, order] = await Promise.all([
    getPublicStore(slug),
    getOrderByNumber(slug, orderNumber)
  ])
  
  if (!store || !order) notFound()

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status)
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${slug}`} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Store</span>
            </Link>
            <h1 className="text-lg font-bold text-white">Order Tracking</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Order Number</p>
              <p className="text-2xl font-mono font-bold text-white">{order.orderNumber}</p>
              <p className="text-sm text-slate-400 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                isCancelled ? 'border-red-500/30 bg-red-500/10' : 'border-slate-600 bg-slate-700'
              }`}>
                {isCancelled ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <span className={`h-2 w-2 rounded-full ${statusColors[order.status]?.replace('text-', 'bg-')}`}></span>
                )}
                <span className={`font-medium ${statusColors[order.status]}`}>
                  {order.status === 'CANCELLED' ? 'Cancelled' : order.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-6">Order Progress</h2>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-slate-700 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStepIndex + 1) / statusSteps.length) * 100}%` }}
                ></div>
              </div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-blue-500 to-green-500 text-white' 
                          : 'bg-slate-700 text-slate-500'
                      } ${isCurrent ? 'ring-4 ring-blue-500/30' : ''}`}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <p className={`mt-3 text-sm font-medium ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Items */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/50">
                  <div className="w-12 h-12 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-slate-400">{item.productName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.productName}</p>
                    <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${Number(item.totalPrice).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">${Number(item.unitPrice).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-700 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax</span>
                <span className="text-white">${Number(order.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shipping</span>
                <span className="text-white">${Number(order.shippingAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-slate-700 pt-2 mt-2">
                <span className="text-white">Total</span>
                <span className="text-white">${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Payment Status */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.paymentStatus === 'PAID' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : order.paymentStatus === 'FAILED'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.paidAt && (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-slate-400">Paid on</span>
                  <span className="text-white">{new Date(order.paidAt).toLocaleDateString()}</span>
                </div>
              )}
              {order.paymentProvider && (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-slate-400">Method</span>
                  <span className="text-white">{order.paymentProvider}</span>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" /> Shipping
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Ship to</p>
                  <p className="text-white font-medium">{order.customerName}</p>
                  <p className="text-slate-300">{order.shippingAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white">{order.customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Order Notes</h2>
                <p className="text-slate-300">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href={`/store/${slug}`} 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
