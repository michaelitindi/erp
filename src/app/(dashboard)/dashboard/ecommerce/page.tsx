import { getStores, getOnlineOrders, getEcommerceStats, getOnlineProducts } from '@/app/actions/ecommerce'
import { checkModuleAccess } from '@/lib/module-access'
import { StoresTable } from '@/components/ecommerce/stores-table'
import { CreateStoreButton } from '@/components/ecommerce/store-buttons'
import { CreateProductButton, ProductsTable } from '@/components/ecommerce/products'
import { Store, ShoppingBag, Package, DollarSign, Clock } from 'lucide-react'

export default async function EcommercePage() {
  await checkModuleAccess('ECOMMERCE')
  const [stores, orders, stats, products] = await Promise.all([
    getStores(), 
    getOnlineOrders(), 
    getEcommerceStats(),
    getOnlineProducts()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">E-Commerce</h1>
          <p className="text-slate-400">Manage online stores, products, and orders</p>
        </div>
        <div className="flex gap-3">
          <CreateStoreButton />
          <CreateProductButton stores={stores} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Store className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Stores</p><p className="text-2xl font-bold text-white">{stats.totalStores}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><Package className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Products</p><p className="text-2xl font-bold text-white">{stats.totalProducts}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><ShoppingBag className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Orders</p><p className="text-2xl font-bold text-white">{stats.totalOrders}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2"><Clock className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-sm text-slate-400">Pending</p><p className="text-2xl font-bold text-white">{stats.pendingOrders}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2"><DollarSign className="h-5 w-5 text-emerald-400" /></div>
            <div><p className="text-sm text-slate-400">Revenue</p><p className="text-2xl font-bold text-white">${stats.revenue.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No online stores yet</h3>
          <p className="mt-2 text-slate-400">Create your first online store to start selling.</p>
          <div className="mt-6"><CreateStoreButton /></div>
        </div>
      ) : (
        <div className="space-y-6">
          <StoresTable stores={stores} />
          
          {/* Products Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Products</h2>
            {products.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
                <Package className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-2 text-slate-400">No products yet. Add your first product to start selling.</p>
                <div className="mt-4"><CreateProductButton stores={stores} /></div>
              </div>
            ) : (
              <ProductsTable products={products} />
            )}
          </div>
          
          {/* Orders Section */}
          {orders.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50">
              <div className="border-b border-slate-700 p-4">
                <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Store</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Customer</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {orders.slice(0, 10).map(order => (
                      <tr key={order.id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4 font-mono text-sm text-white">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{order.store.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{order.customerName}</td>
                        <td className="px-6 py-4 text-sm text-white text-right">${Number(order.totalAmount).toLocaleString()}</td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'DELIVERED' ? 'text-green-400 bg-green-400/10' :
                          order.status === 'SHIPPED' ? 'text-blue-400 bg-blue-400/10' :
                          order.status === 'PENDING' ? 'text-yellow-400 bg-yellow-400/10' :
                          'text-slate-400 bg-slate-400/10'
                        }`}>{order.status}</span></td>
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
