import { getOpportunities, getOpportunityPipeline } from '@/app/actions/opportunities'
import { getCustomers } from '@/app/actions/customers'
import { OpportunitiesTable } from '@/components/crm/opportunities-table'
import { CreateOpportunityButton } from '@/components/crm/opportunity-buttons'
import { Target, DollarSign, TrendingUp, Trophy } from 'lucide-react'

export default async function OpportunitiesPage() {
  const [opportunities, pipeline, customers] = await Promise.all([
    getOpportunities(),
    getOpportunityPipeline(),
    getCustomers()
  ])

  const openOpps = opportunities.filter(o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage))
  const wonOpps = opportunities.filter(o => o.stage === 'CLOSED_WON')
  const totalValue = openOpps.reduce((sum, o) => sum + Number(o.amount), 0)
  const wonValue = wonOpps.reduce((sum, o) => sum + Number(o.amount), 0)
  const avgProbability = openOpps.length > 0 ? Math.round(openOpps.reduce((sum, o) => sum + o.probability, 0) / openOpps.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Opportunities</h1>
          <p className="text-slate-400">Manage your sales pipeline and deals</p>
        </div>
        <CreateOpportunityButton customers={customers} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Target className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Open Deals</p><p className="text-2xl font-bold text-white">{openOpps.length}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><DollarSign className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Pipeline Value</p><p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><TrendingUp className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Avg. Probability</p><p className="text-2xl font-bold text-white">{avgProbability}%</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2"><Trophy className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-sm text-slate-400">Won This Period</p><p className="text-2xl font-bold text-white">${wonValue.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pipeline Stages</h2>
        <div className="grid grid-cols-6 gap-3">
          {pipeline.map((stage) => {
            const stageColors: Record<string, string> = {
              PROSPECTING: 'border-slate-400 bg-slate-400/10',
              QUALIFICATION: 'border-blue-400 bg-blue-400/10',
              PROPOSAL: 'border-purple-400 bg-purple-400/10',
              NEGOTIATION: 'border-orange-400 bg-orange-400/10',
              CLOSED_WON: 'border-green-400 bg-green-400/10',
              CLOSED_LOST: 'border-red-400 bg-red-400/10',
            }
            return (
              <div key={stage.stage} className={`rounded-lg border-2 p-4 text-center ${stageColors[stage.stage]}`}>
                <p className="text-xs text-slate-400 uppercase tracking-wide">{stage.stage.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-white mt-1">{stage.count}</p>
                <p className="text-xs text-slate-400">${stage.amount.toLocaleString()}</p>
              </div>
            )
          })}
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No opportunities yet</h3>
          <p className="mt-2 text-slate-400">Create your first opportunity to start building your pipeline.</p>
          <div className="mt-6"><CreateOpportunityButton customers={customers} /></div>
        </div>
      ) : (
        <OpportunitiesTable opportunities={opportunities} />
      )}
    </div>
  )
}
