'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Loader2, CreditCard, Banknote } from 'lucide-react'
import { createGuestOrder, getStorePaymentInfo } from '@/app/actions/storefront'
import { clearCart } from '@/components/storefront/cart-buttons'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  slug: string
}

interface StorePaymentInfo {
  paymentProvider: string
  currency: string
  name: string
}

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch { return [] }
}

const providerNames: Record<string, { name: string; description: string }> = {
  COD: { name: 'Cash on Delivery', description: 'Pay when you receive your order' },
  STRIPE: { name: 'Stripe', description: 'Pay with credit or debit card' },
  PAYSTACK: { name: 'Paystack', description: 'Pay with card, bank, or mobile money' },
  FLUTTERWAVE: { name: 'Flutterwave', description: 'Pay with card, bank, or mobile money' },
  LEMONSQUEEZY: { name: 'Lemon Squeezy', description: 'Pay with card' },
}

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [storeInfo, setStoreInfo] = useState<StorePaymentInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug)
      const info = await getStorePaymentInfo(p.slug)
      setStoreInfo(info)
    })
    setCart(getCart())
    setMounted(true)
  }, [params])

  if (!mounted || !slug) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.16
  const shipping = cart.length > 0 ? 10 : 0
  const total = subtotal + tax + shipping

  if (cart.length === 0 && !orderNumber) {
    router.push(`/store/${slug}/cart`)
    return null
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-slate-400 mb-6">Thank you for your purchase</p>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 mb-6">
            <p className="text-sm text-slate-400 mb-1">Order Number</p>
            <p className="text-2xl font-mono font-bold text-white">{orderNumber}</p>
          </div>
          <p className="text-sm text-slate-400 mb-6">We've sent a confirmation to your email. You can track your order using the order number above.</p>
          <Link href={`/store/${slug}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      const order = await createGuestOrder({
        storeSlug: slug,
        customerName: formData.get('name') as string,
        customerEmail: formData.get('email') as string,
        shippingAddress: `${formData.get('address')}, ${formData.get('city')}, ${formData.get('country')}`,
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        notes: formData.get('notes') as string || undefined,
        baseUrl: window.location.origin,
      })
      
      clearCart()
      
      // Check if payment redirect is needed
      if ('paymentRequired' in order && order.paymentRequired && 'paymentUrl' in order && order.paymentUrl) {
        // Redirect to payment provider
        window.location.href = order.paymentUrl
      } else {
        // COD or payment not required - show success
        setOrderNumber(order.orderNumber)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
      setIsSubmitting(false)
    }
  }

  const provider = storeInfo?.paymentProvider || 'COD'
  const providerInfo = providerNames[provider] || providerNames.COD

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${slug}/cart`} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Cart</span>
            </Link>
            <h1 className="text-xl font-bold text-white">Checkout</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                    <input name="name" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                    <input name="email" type="email" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Street Address *</label>
                    <input name="address" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" placeholder="123 Main Street" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">City *</label>
                      <input name="city" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Country *</label>
                      <select name="country" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                        <option value="Kenya">Kenya</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
                <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-600 bg-slate-700/50">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    {provider === 'COD' ? (
                      <Banknote className="h-6 w-6 text-blue-400" />
                    ) : (
                      <CreditCard className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{providerInfo.name}</p>
                    <p className="text-sm text-slate-400">{providerInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Order Notes (Optional)</h2>
                <textarea name="notes" rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" placeholder="Special instructions for delivery..." />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-slate-400">{item.name} × {item.quantity}</span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-slate-700 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (16%)</span>
                    <span className="text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-white">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : provider === 'COD' ? (
                    `Place Order - $${total.toFixed(2)}`
                  ) : (
                    `Pay with ${providerInfo.name} - $${total.toFixed(2)}`
                  )}
                </button>
                
                <p className="text-xs text-slate-500 text-center mt-4">
                  {provider === 'COD' 
                    ? 'Payment will be collected on delivery' 
                    : `You'll be redirected to ${providerInfo.name} to complete payment`}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
