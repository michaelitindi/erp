import { getBOMs, getWorkOrders, getManufacturingStats } from '@/app/actions/manufacturing'
import { getProducts } from '@/app/actions/products'
import { checkModuleAccess } from '@/lib/module-access'
import { CreateBOMButton, CreateWorkOrderButton } from '@/components/manufacturing/manufacturing-buttons'
import { BOMsTable } from '@/components/manufacturing/boms-table'
import { WorkOrdersTable } from '@/components/manufacturing/work-orders-table'
import { Cog, FileCode, PlayCircle, Package } from 'lucide-react'

export default async function ManufacturingPage() {
  await checkModuleAccess('MANUFACTURING')
  const [boms, workOrders, stats, products] = await Promise.all([
    getBOMs(), 
    getWorkOrders(), 
    getManufacturingStats(),
    getProducts()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manufacturing</h1>
          <p className="text-slate-400">Bill of Materials and Work Orders</p>
        </div>
        <div className="flex gap-3">
          <CreateBOMButton products={products} />
          <CreateWorkOrderButton boms={boms} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><FileCode className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total BOMs</p><p className="text-2xl font-bold text-white">{stats.totalBOMs}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><FileCode className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Active BOMs</p><p className="text-2xl font-bold text-white">{stats.activeBOMs}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><Cog className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Work Orders</p><p className="text-2xl font-bold text-white">{stats.totalWOs}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2"><PlayCircle className="h-5 w-5 text-orange-400" /></div>
            <div><p className="text-sm text-slate-400">In Progress</p><p className="text-2xl font-bold text-white">{stats.activeWOs}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* BOMs Section */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50">
          <div className="border-b border-slate-700 p-4">
            <h2 className="text-lg font-semibold text-white">Bill of Materials</h2>
          </div>
          <div className="p-4">
            {boms.length === 0 ? (
              <div className="text-center py-8">
                <FileCode className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-2 text-slate-400">No BOMs created yet</p>
                <p className="text-xs text-slate-500 mt-1">Create a BOM to define product components</p>
              </div>
            ) : (
              <BOMsTable boms={boms} />
            )}
          </div>
        </div>

        {/* Work Orders Section */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50">
          <div className="border-b border-slate-700 p-4">
            <h2 className="text-lg font-semibold text-white">Work Orders</h2>
          </div>
          <div className="p-4">
            {workOrders.length === 0 ? (
              <div className="text-center py-8">
                <Cog className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-2 text-slate-400">No work orders yet</p>
                <p className="text-xs text-slate-500 mt-1">Create a work order to schedule production</p>
              </div>
            ) : (
              <WorkOrdersTable workOrders={workOrders} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
