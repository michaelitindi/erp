import { ModuleNav } from '@/components/shared/module-nav'
import { ShoppingBag } from 'lucide-react'

const procurementNavItems = [
  { name: 'Purchase Orders', href: '/dashboard/procurement/purchase-orders', icon: ShoppingBag },
]

export default function ProcurementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0">
      <ModuleNav moduleName="Procurement" items={procurementNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
