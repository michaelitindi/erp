import { getAccounts, seedDefaultAccounts } from '@/app/actions/accounts'
import { AccountsTable } from '@/components/finance/accounts-table'
import { CreateAccountButton, SeedAccountsButton } from '@/components/finance/account-buttons'
import { FileText, Plus } from 'lucide-react'

export default async function AccountsPage() {
  const accounts = await getAccounts()

  const accountsByType = {
    ASSET: accounts.filter(a => a.accountType === 'ASSET'),
    LIABILITY: accounts.filter(a => a.accountType === 'LIABILITY'),
    EQUITY: accounts.filter(a => a.accountType === 'EQUITY'),
    REVENUE: accounts.filter(a => a.accountType === 'REVENUE'),
    EXPENSE: accounts.filter(a => a.accountType === 'EXPENSE'),
  }

  const typeColors = {
    ASSET: 'text-green-400 bg-green-400/10',
    LIABILITY: 'text-red-400 bg-red-400/10',
    EQUITY: 'text-purple-400 bg-purple-400/10',
    REVENUE: 'text-blue-400 bg-blue-400/10',
    EXPENSE: 'text-orange-400 bg-orange-400/10',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chart of Accounts</h1>
          <p className="text-slate-400">Manage your organization&apos;s accounts</p>
        </div>
        <div className="flex gap-3">
          {accounts.length === 0 && <SeedAccountsButton />}
          <CreateAccountButton />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(accountsByType).map(([type, typeAccounts]) => (
          <div
            key={type}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
          >
            <div className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium ${typeColors[type as keyof typeof typeColors]}`}>
              <FileText className="h-3 w-3" />
              {type}
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{typeAccounts.length}</p>
            <p className="text-sm text-slate-400">accounts</p>
          </div>
        ))}
      </div>

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No accounts yet</h3>
          <p className="mt-2 text-slate-400">
            Get started by seeding default accounts or create your first account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <SeedAccountsButton />
            <CreateAccountButton />
          </div>
        </div>
      ) : (
        <AccountsTable accounts={accounts} />
      )}
    </div>
  )
}
