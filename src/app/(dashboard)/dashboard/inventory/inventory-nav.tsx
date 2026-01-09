'use client'

import { ModuleNav } from '@/components/shared/module-nav'
import { Package, Warehouse, AlertTriangle } from 'lucide-react'

const inventoryNavItems = [
  { name: 'Products', href: '/dashboard/inventory/products', icon: Package },
  { name: 'Warehouses', href: '/dashboard/inventory/warehouses', icon: Warehouse },
  { name: 'Reorder Alerts', href: '/dashboard/inventory/alerts', icon: AlertTriangle },
]

export function InventoryModuleNav() {
  return <ModuleNav moduleName="Inventory" items={inventoryNavItems} />
}
