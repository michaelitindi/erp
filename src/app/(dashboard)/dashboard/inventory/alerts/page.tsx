import { getLowStockAlerts } from '@/app/actions/products'
import { AlertTriangle, Package, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function AlertsPage() {
  const alerts = await getLowStockAlerts()

  const critical = alerts.filter(a => a.isCritical)
  const low = alerts.filter(a => !a.isCritical)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reorder Alerts</h1>
          <p className="text-slate-400">Products that need restocking</p>
        </div>
        <Link href="/dashboard/procurement/purchase-orders" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <ShoppingBag className="h-4 w-4" />Create Purchase Order
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
            <div><p className="text-sm text-slate-400">Critical (Out of Stock)</p><p className="text-2xl font-bold text-red-400">{critical.length}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2"><AlertTriangle className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-sm text-slate-400">Low Stock</p><p className="text-2xl font-bold text-yellow-400">{low.length}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Package className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Alerts</p><p className="text-2xl font-bold text-white">{alerts.length}</p></div>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">All stock levels are healthy!</h3>
          <p className="mt-2 text-slate-400">No products are below their reorder levels.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {critical.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Critical - Out of Stock
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {critical.map(product => (
                  <div key={product.id} className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">OUT</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400">Stock:</span> <span className="text-white font-medium">0</span></div>
                      <div><span className="text-slate-400">Reorder Level:</span> <span className="text-white font-medium">{product.reorderLevel}</span></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-500/20">
                      <p className="text-xs text-slate-400">Suggested Order: <span className="text-blue-400 font-medium">{product.suggestedOrder} units</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {low.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Low Stock Warning
              </h2>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Product</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Reorder Level</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Deficit</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Suggested Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {low.map(product => (
                      <tr key={product.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                            {product.totalStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-300">{product.reorderLevel}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-red-400 font-medium">-{Math.abs(product.deficit)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-blue-400 font-medium">{product.suggestedOrder}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
