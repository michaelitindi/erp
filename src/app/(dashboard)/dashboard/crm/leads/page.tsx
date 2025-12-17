import { getLeads } from '@/app/actions/leads'
import { LeadsTable } from '@/components/crm/leads-table'
import { CreateLeadButton } from '@/components/crm/lead-buttons'
import { UserPlus, Flame, Snowflake, Users } from 'lucide-react'

export default async function LeadsPage() {
  const leads = await getLeads()

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    hot: leads.filter(l => l.rating === 'HOT').length,
    totalValue: leads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-slate-400">Manage your sales leads and prospects</p>
        </div>
        <CreateLeadButton />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Users className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Leads</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><UserPlus className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">New Leads</p><p className="text-2xl font-bold text-white">{stats.new}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2"><Flame className="h-5 w-5 text-orange-400" /></div>
            <div><p className="text-sm text-slate-400">Hot Leads</p><p className="text-2xl font-bold text-white">{stats.hot}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><Snowflake className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Est. Value</p><p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No leads yet</h3>
          <p className="mt-2 text-slate-400">Start capturing leads to grow your sales pipeline.</p>
          <div className="mt-6"><CreateLeadButton /></div>
        </div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  )
}
