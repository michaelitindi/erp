'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleStoreStatus } from '@/app/actions/ecommerce'
import { Power, Package, ShoppingBag } from 'lucide-react'

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  primaryColor: string
  isActive: boolean
  currency: string
  createdAt: Date
  _count?: { products: number; orders: number }
}

export function StoresTable({ stores }: { stores: Store[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleToggle(id: string) {
    setProcessingId(id)
    try { await toggleStoreStatus(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="border-b border-slate-700 p-4">
        <h2 className="text-lg font-semibold text-white">Online Stores</h2>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <div key={store.id} className="rounded-xl border border-slate-700 bg-slate-700/30 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: store.primaryColor }}
                >
                  {store.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{store.name}</p>
                  <p className="text-xs text-slate-400">/{store.slug}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(store.id)}
                disabled={processingId === store.id}
                className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                  store.isActive 
                    ? 'text-green-400 hover:bg-green-600/20' 
                    : 'text-slate-400 hover:bg-slate-600/30'
                }`}
                title={store.isActive ? 'Deactivate' : 'Activate'}
              >
                <Power className="h-4 w-4" />
              </button>
            </div>
            
            {store.description && (
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{store.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {store._count?.products || 0} products
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" />
                {store._count?.orders || 0} orders
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-600 flex items-center justify-between">
              <span className="text-xs text-slate-400">{store.currency}</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                store.isActive ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-slate-400/10'
              }`}>
                {store.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
