import { getBudgets, getBudgetStats } from '@/app/actions/budgets'
import { getAccounts } from '@/app/actions/accounts'
import { BudgetsTable } from '@/components/finance/budgets-table'
import { CreateBudgetButton } from '@/components/finance/budget-buttons'
import { PiggyBank, CheckCircle, Calendar, DollarSign } from 'lucide-react'

export default async function BudgetsPage() {
  const [budgets, stats, accounts] = await Promise.all([
    getBudgets(),
    getBudgetStats(),
    getAccounts()
  ])

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budgets</h1>
          <p className="text-slate-400">Manage financial budgets and track variance</p>
        </div>
        <CreateBudgetButton accounts={accounts} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><PiggyBank className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Budgets</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><CheckCircle className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Active</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><Calendar className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Current Year</p><p className="text-2xl font-bold text-white">{currentYear}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2"><DollarSign className="h-5 w-5 text-orange-400" /></div>
            <div><p className="text-sm text-slate-400">{currentYear} Budget</p><p className="text-2xl font-bold text-white">${stats.currentYearTotal.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <PiggyBank className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No budgets yet</h3>
          <p className="mt-2 text-slate-400">Create your first budget to start tracking spending against targets.</p>
          <div className="mt-6"><CreateBudgetButton accounts={accounts} /></div>
        </div>
      ) : (
        <BudgetsTable budgets={budgets} />
      )}
    </div>
  )
}
