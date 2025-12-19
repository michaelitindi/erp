'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, ShoppingCart } from 'lucide-react'
import { updateCartQuantity, removeFromCart, clearCart } from '@/components/storefront/cart-buttons'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  slug: string
}

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch { return [] }
}

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
    setCart(getCart())
    setMounted(true)

    const handleUpdate = () => setCart(getCart())
    window.addEventListener('cart-updated', handleUpdate)
    return () => window.removeEventListener('cart-updated', handleUpdate)
  }, [params])

  if (!mounted || !slug) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.16
  const shipping = cart.length > 0 ? 10 : 0
  const total = subtotal + tax + shipping

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${slug}`} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Store</span>
            </Link>
            <h1 className="text-xl font-bold text-white">Shopping Cart</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-slate-400 mb-6">Add some products to get started</p>
            <Link href={`/store/${slug}/products`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
              <ShoppingBag className="h-5 w-5" />Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                  <div className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-slate-500">{item.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <Link href={`/store/${slug}/product/${item.slug}`} className="text-white font-medium hover:text-blue-400">{item.name}</Link>
                    <p className="text-sm text-slate-400 mt-1">${item.price.toFixed(2)} each</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-slate-600 rounded-lg">
                        <button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} className="p-2 text-slate-400 hover:text-white"><Minus className="h-4 w-4" /></button>
                        <span className="px-3 text-white">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} className="p-2 text-slate-400 hover:text-white"><Plus className="h-4 w-4" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="p-2 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <button onClick={() => clearCart()} className="text-sm text-slate-400 hover:text-red-400 mt-2">Clear cart</button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
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

                <Link href={`/store/${slug}/checkout`} className="block w-full mt-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition-colors">
                  Proceed to Checkout
                </Link>
                
                <Link href={`/store/${slug}/products`} className="block w-full mt-3 py-3 rounded-xl border border-slate-600 text-white font-medium text-center hover:bg-slate-700 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
