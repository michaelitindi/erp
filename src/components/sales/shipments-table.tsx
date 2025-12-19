'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteDelivery, updateDeliveryStatus, updateTracking } from '@/app/actions/deliveries'
import { Trash2, Truck, CheckCircle, MapPin, ExternalLink } from 'lucide-react'

interface Delivery {
  id: string
  deliveryNumber: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  shippingCity: string | null
  shippingCountry: string | null
  deliveryDate: Date
  deliveredAt: Date | null
  salesOrder: { orderNumber: string; customer: { companyName: string } }
  _count?: { items: number }
}

const carrierLinks: Record<string, string> = {
  'UPS': 'https://www.ups.com/track?tracknum=',
  'FEDEX': 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
  'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB=',
  'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
}

export function ShipmentsTable({ deliveries }: { deliveries: Delivery[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const router = useRouter()

  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    IN_TRANSIT: 'text-purple-400 bg-purple-400/10',
    DELIVERED: 'text-green-400 bg-green-400/10',
    FAILED: 'text-red-400 bg-red-400/10',
  }

  function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
    if (!carrier || !trackingNumber) return null
    const baseUrl = carrierLinks[carrier.toUpperCase()]
    return baseUrl ? `${baseUrl}${trackingNumber}` : null
  }

  async function handleStatusChange(id: string, status: string) {
    setProcessingId(id)
    try { await updateDeliveryStatus(id, status); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  async function handleSaveTracking(id: string) {
    setProcessingId(id)
    try { 
      await updateTracking(id, carrier, trackingNumber)
      setEditingId(null)
      router.refresh() 
    }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this delivery?')) return
    setProcessingId(id)
    try { await deleteDelivery(id); router.refresh() }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setProcessingId(null) }
  }

  function startEditing(delivery: Delivery) {
    setEditingId(delivery.id)
    setCarrier(delivery.carrier || '')
    setTrackingNumber(delivery.trackingNumber || '')
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Delivery #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Order</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Destination</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tracking</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {deliveries.map((d) => {
            const trackingUrl = getTrackingUrl(d.carrier, d.trackingNumber)
            return (
              <tr key={d.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white font-mono">{d.deliveryNumber}</p>
                  <p className="text-xs text-slate-400">{d._count?.items || 0} items</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-white">{d.salesOrder.orderNumber}</p>
                  <p className="text-xs text-slate-400">{d.salesOrder.customer.companyName}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[d.shippingCity, d.shippingCountry].filter(Boolean).join(', ') || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingId === d.id ? (
                    <div className="flex gap-2">
                      <select value={carrier} onChange={e => setCarrier(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white">
                        <option value="">Carrier</option>
                        <option value="UPS">UPS</option>
                        <option value="FedEx">FedEx</option>
                        <option value="DHL">DHL</option>
                        <option value="USPS">USPS</option>
                      </select>
                      <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking #" className="w-28 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white" />
                      <button onClick={() => handleSaveTracking(d.id)} className="text-xs text-green-400 hover:text-green-300">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {d.carrier && d.trackingNumber ? (
                        <>
                          <span className="text-sm text-slate-300">{d.carrier}: <span className="font-mono">{d.trackingNumber}</span></span>
                          {trackingUrl && (
                            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </>
                      ) : (
                        <button onClick={() => startEditing(d)} className="text-xs text-blue-400 hover:text-blue-300">+ Add Tracking</button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[d.status]}`}>{d.status.replace('_', ' ')}</span></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {d.status === 'PENDING' && (
                      <button onClick={() => handleStatusChange(d.id, 'IN_TRANSIT')} disabled={processingId === d.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-600/20 hover:text-purple-400 transition-colors disabled:opacity-50" title="Ship">
                        <Truck className="h-4 w-4" />
                      </button>
                    )}
                    {d.status === 'IN_TRANSIT' && (
                      <button onClick={() => handleStatusChange(d.id, 'DELIVERED')} disabled={processingId === d.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-colors disabled:opacity-50" title="Mark Delivered">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)} disabled={processingId === d.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
