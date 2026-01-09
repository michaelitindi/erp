import { checkModuleAccess } from '@/lib/module-access'
import { ProcurementModuleNav } from './procurement-nav'

export default async function ProcurementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkModuleAccess('PROCUREMENT')
  
  return (
    <div className="space-y-0">
      <ProcurementModuleNav />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

