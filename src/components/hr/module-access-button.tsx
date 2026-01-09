'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEmployeeModules } from '@/app/actions/employees'
import { ALL_MODULES } from '@/lib/modules'
import { Settings, X, Check } from 'lucide-react'

interface ModuleAccessButtonProps {
  employeeId: string
  employeeName: string
  currentModules: string[]
  orgEnabledModules: string[]  // Only show modules the org has enabled
}

export function ModuleAccessButton({ 
  employeeId, 
  employeeName, 
  currentModules,
  orgEnabledModules 
}: ModuleAccessButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>(currentModules)
  const router = useRouter()

  // Filter to only show modules that the org has enabled
  const availableModules = ALL_MODULES.filter(m => orgEnabledModules.includes(m.id))

  function toggleModule(moduleId: string) {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    )
  }

  async function handleSave() {
    setIsLoading(true)
    try {
      await updateEmployeeModules(employeeId, selectedModules)
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      alert('Failed to update module access')
    }
    setIsLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg bg-purple-600/20 border border-purple-600/50 px-2 py-1 text-xs font-medium text-purple-400 hover:bg-purple-600/30 transition-colors"
        title="Manage module access"
      >
        <Settings className="h-3 w-3" />
        Modules
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Module Access</h2>
                <p className="text-sm text-slate-400">{employeeName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Select which modules this employee can access. They will always have access to My Portal.
            </p>

            {availableModules.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No modules enabled for this organization yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableModules.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedModules.includes(module.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-xl">{module.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{module.name}</div>
                      <div className="text-xs text-slate-400">{module.description}</div>
                    </div>
                    {selectedModules.includes(module.id) && (
                      <Check className="h-5 w-5 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

