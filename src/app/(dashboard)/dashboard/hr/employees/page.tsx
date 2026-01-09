import { getEmployees, getEmployeeStats } from '@/app/actions/employees'
import { getOrganizationWithModules } from '@/app/actions/onboarding'
import { EmployeesTable } from '@/components/hr/employees-table'
import { CreateEmployeeButton } from '@/components/hr/employee-buttons'
import { Users, UserCheck, Briefcase, Clock } from 'lucide-react'

export default async function EmployeesPage() {
  const [employees, stats, org] = await Promise.all([
    getEmployees(),
    getEmployeeStats(),
    getOrganizationWithModules()
  ])
  
  const orgModules = org?.enabledModules || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-slate-400">Manage your workforce</p>
        </div>
        <CreateEmployeeButton />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Users className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Employees</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><UserCheck className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Active</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><Briefcase className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Full-Time</p><p className="text-2xl font-bold text-white">{stats.fullTime}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2"><Clock className="h-5 w-5 text-orange-400" /></div>
            <div><p className="text-sm text-slate-400">Part-Time</p><p className="text-2xl font-bold text-white">{stats.partTime}</p></div>
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No employees yet</h3>
          <p className="mt-2 text-slate-400">Add your first employee to get started.</p>
          <div className="mt-6"><CreateEmployeeButton /></div>
        </div>
      ) : (
        <EmployeesTable employees={employees} orgEnabledModules={orgModules} />
      )}
    </div>
  )
}

