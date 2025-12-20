import { ModuleNav } from '@/components/shared/module-nav'
import { Building2, Truck, UserPlus, Target } from 'lucide-react'

const crmNavItems = [
  { name: 'Customers', href: '/dashboard/crm/customers', icon: Building2 },
  { name: 'Vendors', href: '/dashboard/crm/vendors', icon: Truck },
  { name: 'Leads', href: '/dashboard/crm/leads', icon: UserPlus },
  { name: 'Opportunities', href: '/dashboard/crm/opportunities', icon: Target },
]

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0">
      <ModuleNav moduleName="CRM" items={crmNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
