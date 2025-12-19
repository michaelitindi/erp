'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number | { toNumber?: () => number }
  stockQuantity: number
}

const getPrice = (p: number | { toNumber?: () => number }): number => typeof p === 'number' ? p : p?.toNumber?.() || 0

// Simple localStorage cart
function getCart(): { productId: string; name: string; price: number; quantity: number; slug: string }[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch { return [] }
}

function saveCart(cart: { productId: string; name: string; price: number; quantity: number; slug: string }[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export function addToCart(product: Product) {
  const cart = getCart()
  const existing = cart.find(i => i.productId === product.id)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ 
      productId: product.id, 
      name: product.name, 
      price: getPrice(product.price), 
      quantity: 1,
      slug: product.slug
    })
  }
  saveCart(cart)
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter(i => i.productId !== productId)
  saveCart(cart)
}

export function updateCartQuantity(productId: string, quantity: number) {
  const cart = getCart()
  const item = cart.find(i => i.productId === productId)
  if (item) {
    if (quantity <= 0) {
      saveCart(cart.filter(i => i.productId !== productId))
    } else {
      item.quantity = quantity
      saveCart(cart)
    }
  }
}

export function clearCart() {
  saveCart([])
}

export function useCart() {
  const [cart, setCart] = useState(getCart())
  
  if (typeof window !== 'undefined') {
    window.addEventListener('cart-updated', () => {
      setCart(getCart())
    })
  }

  return cart
}

export function AddToCartButton({ product, currency, size = 'small' }: { product: Product; currency: string; size?: 'small' | 'large' }) {
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)

  function handleAdd() {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const isOutOfStock = product.stockQuantity <= 0

  if (size === 'large') {
    return (
      <div className="flex gap-3">
        <div className="flex items-center border border-slate-600 rounded-xl">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-slate-400 hover:text-white">-</button>
          <span className="px-4 py-3 text-white font-medium">{quantity}</span>
          <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} className="px-4 py-3 text-slate-400 hover:text-white">+</button>
        </div>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock || added}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            added ? 'bg-green-600 text-white' : isOutOfStock ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" /> Added to Cart
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" /> Add to Cart - {currency} {(getPrice(product.price) * quantity).toFixed(2)}
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isOutOfStock || added}
      className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
        added ? 'bg-green-600/20 text-green-400' : isOutOfStock ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600'
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : isOutOfStock ? (
        'Out of Stock'
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </>
      )}
    </button>
  )
}
