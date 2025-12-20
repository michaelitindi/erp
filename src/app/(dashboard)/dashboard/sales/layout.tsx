import { ModuleNav } from '@/components/shared/module-nav'
import { ShoppingCart, Truck } from 'lucide-react'

const salesNavItems = [
  { name: 'Sales Orders', href: '/dashboard/sales/orders', icon: ShoppingCart },
  { name: 'Shipments', href: '/dashboard/sales/shipments', icon: Truck },
]

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0">
      <ModuleNav moduleName="Sales" items={salesNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
