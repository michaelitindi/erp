'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions/onboarding'
import { ALL_MODULES, DEFAULT_MODULES, ModuleType } from '@/lib/modules'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

export default function OnboardingPage() {
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>(DEFAULT_MODULES)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const toggleModule = (moduleId: ModuleType) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSubmit = async () => {
    if (selectedModules.length === 0) {
      setError('Please select at least one module')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await completeOnboarding(selectedModules)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome to Your ERP
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Choose the modules you need for your business. You can always change this later in Settings.
          </p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {ALL_MODULES.map(module => {
            const isSelected = selectedModules.includes(module.id)
            return (
              <button
                key={module.id}
                onClick={() => toggleModule(module.id)}
                className={`
                  relative group p-5 rounded-xl border-2 transition-all duration-300 text-left
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  }
                `}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110
                  ${isSelected ? 'bg-blue-500/20' : 'bg-slate-700/50'}
                `}>
                  {module.icon}
                </div>
                
                {/* Text */}
                <h3 className={`font-semibold mb-1 ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                  {module.name}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {module.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedModules.length === 0}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-slate-500">
            {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>
    </div>
  )
}
