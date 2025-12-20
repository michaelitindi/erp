'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface ModuleNavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface ModuleNavProps {
  moduleName: string
  items: ModuleNavItem[]
}

export function ModuleNav({ moduleName, items }: ModuleNavProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-700 bg-slate-800/30 backdrop-blur-sm">
      <div className="flex items-center gap-1 px-6 py-2">
        <span className="mr-4 text-sm font-medium text-slate-400">{moduleName}</span>
        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
