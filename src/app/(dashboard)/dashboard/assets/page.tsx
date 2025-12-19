import { getAssets, getAssetStats } from '@/app/actions/assets'
import { AssetsTable } from '@/components/assets/assets-table'
import { CreateAssetButton } from '@/components/assets/asset-buttons'
import { Building2, Package, DollarSign, CheckCircle } from 'lucide-react'

export default async function AssetsPage() {
  const [assets, stats] = await Promise.all([getAssets(), getAssetStats()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Asset Management</h1>
          <p className="text-slate-400">Track fixed assets and depreciation</p>
        </div>
        <CreateAssetButton />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Building2 className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Assets</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><CheckCircle className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Active</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><DollarSign className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Total Book Value</p><p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No assets yet</h3>
          <p className="mt-2 text-slate-400">Add your first asset to start tracking your fixed assets.</p>
          <div className="mt-6"><CreateAssetButton /></div>
        </div>
      ) : (
        <AssetsTable assets={assets} />
      )}
    </div>
  )
}
