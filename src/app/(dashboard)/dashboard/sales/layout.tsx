import { checkModuleAccess } from '@/lib/module-access'
import { SalesModuleNav } from './sales-nav'

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user has access to SALES module
  await checkModuleAccess('SALES')
  
  return (
    <div className="space-y-0">
      <SalesModuleNav />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

