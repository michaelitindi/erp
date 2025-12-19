'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOnlineProduct, toggleProductActive, deleteOnlineProduct } from '@/app/actions/ecommerce'
import { Plus, X, Power, Trash2, Star } from 'lucide-react'

interface Store { id: string; name: string }
interface Product {
  id: string
  name: string
  slug: string
  price: number | { toNumber: () => number }
  compareAtPrice: number | { toNumber: () => number } | null
  isActive: boolean
  isFeatured: boolean
  stockQuantity: number
  store?: { name: string }
}

const getPrice = (p: number | { toNumber: () => number } | null): number => {
  if (!p) return 0
  return typeof p === 'number' ? p : p?.toNumber?.() || 0
}

export function CreateProductButton({ stores }: { stores: Store[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createOnlineProduct({
        storeId: formData.get('storeId') as string,
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: formData.get('description') as string || null,
        price: parseFloat(formData.get('price') as string),
        compareAtPrice: parseFloat(formData.get('compareAtPrice') as string) || null,
        isFeatured: formData.get('isFeatured') === 'true',
        stockQuantity: parseInt(formData.get('stockQuantity') as string) || 0,
      })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} disabled={stores.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50">
        <Plus className="h-4 w-4" />Add Product
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add Product</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Store *</label>
                <select name="storeId" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                  <option value="">Select Store...</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Product Name *</label>
                <input 
                  name="name" 
                  required 
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  onChange={(e) => {
                    const slugInput = e.target.form?.elements.namedItem('slug') as HTMLInputElement
                    if (slugInput) slugInput.value = generateSlug(e.target.value)
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL Slug *</label>
                <input name="slug" required pattern="[a-z0-9-]+" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Price *</label>
                  <input name="price" type="number" min="0.01" step="0.01" required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Compare At Price</label>
                  <input name="compareAtPrice" type="number" min="0" step="0.01" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Stock Quantity</label>
                  <input name="stockQuantity" type="number" min="0" defaultValue="0" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input name="isFeatured" type="checkbox" value="true" className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-slate-300">Featured Product</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50">{isLoading ? 'Adding...' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleToggle(id: string) {
    setProcessingId(id)
    try { await toggleProductActive(id); router.refresh() }
    catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    setProcessingId(id)
    try { await deleteOnlineProduct(id); router.refresh() }
    catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  if (products.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Store</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Price</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Stock</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-slate-700/30">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {product.isFeatured && <Star className="h-4 w-4 text-yellow-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{product.name}</p>
                    <p className="text-xs text-slate-400">/{product.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-300">{product.store?.name}</td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-medium text-white">${getPrice(product.price).toFixed(2)}</span>
                {product.compareAtPrice && (
                  <span className="ml-2 text-xs text-slate-500 line-through">${getPrice(product.compareAtPrice).toFixed(2)}</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`text-sm ${product.stockQuantity <= 5 ? 'text-red-400' : 'text-slate-300'}`}>{product.stockQuantity}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-slate-400/10'}`}>
                  {product.isActive ? 'Active' : 'Draft'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => handleToggle(product.id)} disabled={processingId === product.id} className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${product.isActive ? 'text-green-400 hover:bg-green-600/20' : 'text-slate-400 hover:bg-slate-600/30'}`} title={product.isActive ? 'Deactivate' : 'Activate'}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} disabled={processingId === product.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
