'use client'

import { ModuleNav } from '@/components/shared/module-nav'
import { ShoppingBag } from 'lucide-react'

const procurementNavItems = [
  { name: 'Purchase Orders', href: '/dashboard/procurement/purchase-orders', icon: ShoppingBag },
]

export function ProcurementModuleNav() {
  return <ModuleNav moduleName="Procurement" items={procurementNavItems} />
}
