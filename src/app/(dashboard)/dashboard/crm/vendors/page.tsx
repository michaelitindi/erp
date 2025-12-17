import { getVendors } from '@/app/actions/vendors'
import { VendorsTable } from '@/components/crm/vendors-table'
import { CreateVendorButton } from '@/components/crm/vendor-buttons'
import { Truck, Building2 } from 'lucide-react'

export default async function VendorsPage() {
  const vendors = await getVendors()

  const activeVendors = vendors.filter(v => v.status === 'ACTIVE')
  const totalBills = vendors.reduce((sum, v) => sum + (v._count?.bills || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors</h1>
          <p className="text-slate-400">Manage your suppliers and vendors</p>
        </div>
        <CreateVendorButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Truck className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Vendors</p>
              <p className="text-2xl font-bold text-white">{vendors.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Building2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Vendors</p>
              <p className="text-2xl font-bold text-white">{activeVendors.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Truck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Bills</p>
              <p className="text-2xl font-bold text-white">{totalBills}</p>
            </div>
          </div>
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No vendors yet</h3>
          <p className="mt-2 text-slate-400">Add your first vendor to start tracking bills.</p>
          <div className="mt-6"><CreateVendorButton /></div>
        </div>
      ) : (
        <VendorsTable vendors={vendors} />
      )}
    </div>
  )
}
