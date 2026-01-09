'use client'

import { ModuleNav } from '@/components/shared/module-nav'
import { Users, Calendar } from 'lucide-react'

const hrNavItems = [
  { name: 'Employees', href: '/dashboard/hr/employees', icon: Users },
  { name: 'Leave', href: '/dashboard/hr/leave', icon: Calendar },
]

export function HRModuleNav() {
  return <ModuleNav moduleName="HR" items={hrNavItems} />
}
