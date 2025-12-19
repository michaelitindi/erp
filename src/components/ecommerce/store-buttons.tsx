'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStore } from '@/app/actions/ecommerce'
import { Plus, X, Eye, EyeOff, CreditCard, Banknote, AlertCircle } from 'lucide-react'

type PaymentProvider = 'COD' | 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE' | 'LEMONSQUEEZY'

const providerInfo: Record<PaymentProvider, { name: string; description: string; regions: string }> = {
  COD: { name: 'Cash on Delivery', description: 'Customers pay on delivery', regions: 'All regions' },
  STRIPE: { name: 'Stripe', description: 'Credit/Debit cards, Apple Pay, Google Pay', regions: 'US, EU, UK, AU, etc.' },
  PAYSTACK: { name: 'Paystack', description: 'Cards, bank, mobile money', regions: 'Nigeria, Ghana, South Africa, Kenya' },
  FLUTTERWAVE: { name: 'Flutterwave', description: 'Cards, mobile money, bank transfer', regions: 'Africa, UK, EU' },
  LEMONSQUEEZY: { name: 'Lemon Squeezy', description: 'Digital products, subscriptions', regions: 'Global' },
}

export function CreateStoreButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('COD')
  const [showSecrets, setShowSecrets] = useState(false)
  const router = useRouter()

  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createStore({
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: formData.get('description') as string || null,
        primaryColor: formData.get('primaryColor') as string || '#3B82F6',
        currency: formData.get('currency') as string || 'USD',
        paymentProvider: selectedProvider,
        stripePublicKey: formData.get('stripePublicKey') as string || null,
        stripeSecretKey: formData.get('stripeSecretKey') as string || null,
        paystackPublicKey: formData.get('paystackPublicKey') as string || null,
        paystackSecretKey: formData.get('paystackSecretKey') as string || null,
        flutterwavePublicKey: formData.get('flutterwavePublicKey') as string || null,
        flutterwaveSecretKey: formData.get('flutterwaveSecretKey') as string || null,
        lemonSqueezyApiKey: formData.get('lemonSqueezyApiKey') as string || null,
        lemonSqueezyStoreId: formData.get('lemonSqueezyStoreId') as string || null,
      })
      setIsOpen(false)
      setSelectedProvider('COD')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
        <Plus className="h-4 w-4" />Create Store
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create Online Store</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Store Name *</label>
                  <input 
                    name="name" 
                    required 
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    onChange={(e) => {
                      const slugInput = e.target.form?.elements.namedItem('slug') as HTMLInputElement
                      if (slugInput) slugInput.value = generateSlug(e.target.value)
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">URL Slug *</label>
                  <input name="slug" required pattern="[a-z0-9-]+" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Primary Color</label>
                  <input name="primaryColor" type="color" defaultValue="#3B82F6" className="w-full h-10 rounded-lg border border-slate-600 bg-slate-700 px-1 py-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
                  <select name="currency" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="GHS">GHS (₵)</option>
                    <option value="ZAR">ZAR (R)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              {/* Payment Provider Section */}
              <div className="border-t border-slate-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Gateway
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {(Object.keys(providerInfo) as PaymentProvider[]).map(provider => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setSelectedProvider(provider)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedProvider === provider 
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500' 
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {provider === 'COD' ? <Banknote className="h-4 w-4 text-slate-300" /> : <CreditCard className="h-4 w-4 text-slate-300" />}
                        <span className="text-sm font-medium text-white">{providerInfo[provider].name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{providerInfo[provider].regions}</p>
                    </button>
                  ))}
                </div>

                {/* API Keys for selected provider */}
                {selectedProvider !== 'COD' && (
                  <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400">API keys are encrypted and stored securely</span>
                      </div>
                      <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                        {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showSecrets ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {selectedProvider === 'STRIPE' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Publishable Key</label>
                          <input name="stripePublicKey" type={showSecrets ? 'text' : 'password'} placeholder="pk_..." className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Secret Key</label>
                          <input name="stripeSecretKey" type={showSecrets ? 'text' : 'password'} placeholder="sk_..." className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                      </div>
                    )}

                    {selectedProvider === 'PAYSTACK' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Public Key</label>
                          <input name="paystackPublicKey" type={showSecrets ? 'text' : 'password'} placeholder="pk_..." className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Secret Key</label>
                          <input name="paystackSecretKey" type={showSecrets ? 'text' : 'password'} placeholder="sk_..." className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                      </div>
                    )}

                    {selectedProvider === 'FLUTTERWAVE' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Public Key</label>
                          <input name="flutterwavePublicKey" type={showSecrets ? 'text' : 'password'} placeholder="FLWPUBK_..." className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Secret Key</label>
                          <input name="flutterwaveSecretKey" type={showSecrets ? 'text' : 'password'} placeholder="FLWSECK_..." className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                      </div>
                    )}

                    {selectedProvider === 'LEMONSQUEEZY' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                          <input name="lemonSqueezyApiKey" type={showSecrets ? 'text' : 'password'} className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Store ID</label>
                          <input name="lemonSqueezyStoreId" type="text" className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Creating...' : 'Create Store'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
