import { checkModuleAccess } from '@/lib/module-access'
import { InventoryModuleNav } from './inventory-nav'

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkModuleAccess('INVENTORY')
  
  return (
    <div className="space-y-0">
      <InventoryModuleNav />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

