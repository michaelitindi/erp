'use client'

import { ModuleNav } from '@/components/shared/module-nav'
import { ShoppingCart, Truck } from 'lucide-react'

const salesNavItems = [
  { name: 'Sales Orders', href: '/dashboard/sales/orders', icon: ShoppingCart },
  { name: 'Shipments', href: '/dashboard/sales/shipments', icon: Truck },
]

export function SalesModuleNav() {
  return <ModuleNav moduleName="Sales" items={salesNavItems} />
}
