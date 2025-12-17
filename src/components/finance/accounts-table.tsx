'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccount } from '@/app/actions/accounts'
import { Trash2, Edit, MoreHorizontal } from 'lucide-react'

interface Account {
  id: string
  accountNumber: string
  accountName: string
  accountType: string
  balance: number | { toNumber: () => number }
  isActive: boolean
  parent?: { accountNumber: string; accountName: string } | null
  _count?: { children: number }
}

interface AccountsTableProps {
  accounts: Account[]
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const typeColors = {
    ASSET: 'text-green-400 bg-green-400/10',
    LIABILITY: 'text-red-400 bg-red-400/10',
    EQUITY: 'text-purple-400 bg-purple-400/10',
    REVENUE: 'text-blue-400 bg-blue-400/10',
    EXPENSE: 'text-orange-400 bg-orange-400/10',
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this account?')) return
    
    setDeletingId(id)
    try {
      await deleteAccount(id)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeletingId(null)
    }
  }

  const getBalance = (balance: number | { toNumber: () => number }): number => {
    if (typeof balance === 'number') return balance
    if (balance && typeof balance.toNumber === 'function') return balance.toNumber()
    return 0
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Account #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {accounts.map((account) => (
            <tr key={account.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-mono text-sm text-white">{account.accountNumber}</span>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{account.accountName}</p>
                  {account.parent && (
                    <p className="text-xs text-slate-400">
                      Parent: {account.parent.accountNumber} - {account.parent.accountName}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${typeColors[account.accountType as keyof typeof typeColors]}`}>
                  {account.accountType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm text-white font-mono">
                  ${getBalance(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  account.isActive 
                    ? 'text-green-400 bg-green-400/10' 
                    : 'text-slate-400 bg-slate-400/10'
                }`}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
