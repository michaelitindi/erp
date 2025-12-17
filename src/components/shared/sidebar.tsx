'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  Users,
  Building2,
  Package,
  ShoppingCart,
  Truck,
  UserCircle,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  Wallet,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Finance',
    icon: Wallet,
    children: [
      { name: 'Chart of Accounts', href: '/dashboard/finance/accounts', icon: FileText },
      { name: 'Invoices', href: '/dashboard/finance/invoices', icon: Receipt },
      { name: 'Bills', href: '/dashboard/finance/bills', icon: CreditCard },
      { name: 'Payments', href: '/dashboard/finance/payments', icon: CreditCard },
    ]
  },
  { 
    name: 'CRM',
    icon: Users,
    children: [
      { name: 'Customers', href: '/dashboard/crm/customers', icon: Building2 },
      { name: 'Vendors', href: '/dashboard/crm/vendors', icon: Truck },
    ]
  },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'HR', href: '/dashboard/hr', icon: UserCircle },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-800/50 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-700 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <span className="text-xl font-semibold text-white">ERP System</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div className="mb-2">
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400">
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
