import { ModuleNav } from '@/components/shared/module-nav'
import { Users, Calendar } from 'lucide-react'

const hrNavItems = [
  { name: 'Employees', href: '/dashboard/hr/employees', icon: Users },
  { name: 'Leave', href: '/dashboard/hr/leave', icon: Calendar },
]

export default function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0">
      <ModuleNav moduleName="HR" items={hrNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
