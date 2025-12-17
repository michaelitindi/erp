'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCustomer } from '@/app/actions/customers'
import { Trash2, Eye, Mail, Phone } from 'lucide-react'

interface Customer {
  id: string
  customerNumber: string
  companyName: string
  contactPerson: string | null
  email: string
  phone: string | null
  status: string
  customerType: string
  _count?: { invoices: number }
}

interface CustomersTableProps {
  customers: Customer[]
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    setDeletingId(id)
    try {
      await deleteCustomer(id)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
              Invoices
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
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{customer.companyName}</p>
                  <p className="text-xs text-slate-400 font-mono">{customer.customerNumber}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {customer.contactPerson && (
                    <p className="text-sm text-white">{customer.contactPerson}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Mail className="h-3 w-3" />
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                  customer.customerType === 'BUSINESS' 
                    ? 'text-blue-400 bg-blue-400/10' 
                    : 'text-purple-400 bg-purple-400/10'
                }`}>
                  {customer.customerType}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-sm text-white">{customer._count?.invoices || 0}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  customer.status === 'ACTIVE' 
                    ? 'text-green-400 bg-green-400/10' 
                    : 'text-slate-400 bg-slate-400/10'
                }`}>
                  {customer.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    disabled={deletingId === customer.id}
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
