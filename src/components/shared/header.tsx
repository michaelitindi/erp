'use client'

import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import { Bell, Search } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800/50 px-6 backdrop-blur-xl">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-80 rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Organization Switcher */}
        <OrganizationSwitcher 
          appearance={{
            elements: {
              rootBox: 'flex items-center',
              organizationSwitcherTrigger: 'bg-slate-700 border-slate-600 hover:bg-slate-600 rounded-lg px-3 py-2',
              organizationPreviewTextContainer: 'text-white',
              organizationSwitcherTriggerIcon: 'text-slate-300',
              organizationPreviewMainIdentifier: 'text-white',
              organizationPreviewSecondaryIdentifier: 'text-slate-400',
            }
          }}
          afterCreateOrganizationUrl="/dashboard"
          afterLeaveOrganizationUrl="/"
          afterSelectOrganizationUrl="/dashboard"
        />

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Button */}
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9',
            }
          }}
        />
      </div>
    </header>
  )
}
