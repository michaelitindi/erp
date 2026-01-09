import { checkModuleAccess } from '@/lib/module-access'
import { FinanceModuleNav } from './finance-nav'

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkModuleAccess('FINANCE')
  
  return (
    <div className="space-y-0">
      <FinanceModuleNav />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

