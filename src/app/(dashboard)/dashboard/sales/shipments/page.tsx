import { getDeliveries, getDeliveryStats } from '@/app/actions/deliveries'
import { ShipmentsTable } from '@/components/sales/shipments-table'
import { Truck, Package, MapPin, CheckCircle } from 'lucide-react'

export default async function ShipmentsPage() {
  const [deliveries, stats] = await Promise.all([
    getDeliveries(),
    getDeliveryStats()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shipments</h1>
          <p className="text-slate-400">Track deliveries and shipments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Package className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Shipments</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2"><Package className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-sm text-slate-400">Pending</p><p className="text-2xl font-bold text-white">{stats.pending}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><Truck className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">In Transit</p><p className="text-2xl font-bold text-white">{stats.inTransit}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><CheckCircle className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Delivered</p><p className="text-2xl font-bold text-white">{stats.delivered}</p></div>
          </div>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No shipments yet</h3>
          <p className="mt-2 text-slate-400">Shipments are created when sales orders are shipped.</p>
        </div>
      ) : (
        <ShipmentsTable deliveries={deliveries} />
      )}
    </div>
  )
}
