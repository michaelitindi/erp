'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEmployee, updateEmployeeStatus } from '@/app/actions/employees'
import { ModuleAccessButton } from './module-access-button'
import { Trash2, UserX, UserCheck } from 'lucide-react'

interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  department: string | null
  position: string
  employmentType: string
  status: string
  salary: number | { toNumber: () => number } | null
  manager: { firstName: string; lastName: string } | null
  allowedModules: string[]
  _count?: { leaveRequests: number; timesheets: number }
}

interface EmployeesTableProps {
  employees: Employee[]
  orgEnabledModules: string[]
}

const getAmount = (amt: number | { toNumber: () => number } | null): number => {
  if (!amt) return 0
  return typeof amt === 'number' ? amt : amt?.toNumber?.() || 0
}

export function EmployeesTable({ employees, orgEnabledModules }: EmployeesTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const statusColors: Record<string, string> = {
    ACTIVE: 'text-green-400 bg-green-400/10',
    INACTIVE: 'text-yellow-400 bg-yellow-400/10',
    TERMINATED: 'text-red-400 bg-red-400/10',
  }

  const typeColors: Record<string, string> = {
    FULL_TIME: 'text-blue-400',
    PART_TIME: 'text-purple-400',
    CONTRACT: 'text-orange-400',
  }

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateEmployeeStatus(id, status); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this employee?')) return
    setProcessingId(id)
    try { await deleteEmployee(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Employee</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Position</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-white">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-slate-400">{emp.employeeNumber} • {emp.email}</p>
              </td>
              <td className="px-6 py-4"><span className="text-sm text-slate-300">{emp.position}</span></td>
              <td className="px-6 py-4"><span className="text-sm text-slate-300">{emp.department || '—'}</span></td>
              <td className="px-6 py-4"><span className={`text-sm font-medium ${typeColors[emp.employmentType]}`}>{emp.employmentType.replace('_', '-')}</span></td>
              <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[emp.status]}`}>{emp.status}</span></td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <ModuleAccessButton
                    employeeId={emp.id}
                    employeeName={`${emp.firstName} ${emp.lastName}`}
                    currentModules={emp.allowedModules}
                    orgEnabledModules={orgEnabledModules}
                  />
                  {emp.status === 'ACTIVE' && (
                    <button onClick={() => handleStatusChange(emp.id, 'INACTIVE')} disabled={processingId === emp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-yellow-600/20 hover:text-yellow-400 transition-colors disabled:opacity-50" title="Deactivate">
                      <UserX className="h-4 w-4" />
                    </button>
                  )}
                  {emp.status === 'INACTIVE' && (
                    <button onClick={() => handleStatusChange(emp.id, 'ACTIVE')} disabled={processingId === emp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50" title="Activate">
                      <UserCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(emp.id)} disabled={processingId === emp.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete">
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
