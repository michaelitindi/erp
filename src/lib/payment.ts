/**
 * Payment Gateway Service
 * Supports: Stripe, Paystack, Flutterwave, LemonSqueezy, and COD
 */

export type PaymentProvider = 'COD' | 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE' | 'LEMONSQUEEZY'

export interface PaymentConfig {
  provider: PaymentProvider
  publicKey?: string
  secretKey?: string
  storeId?: string // For LemonSqueezy
}

export interface PaymentInitParams {
  orderId: string
  orderNumber: string
  amount: number // In smallest currency unit (cents/kobo)
  currency: string
  customerEmail: string
  customerName: string
  description?: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

export interface PaymentResult {
  success: boolean
  paymentReference?: string
  redirectUrl?: string
  error?: string
}

export interface WebhookPayload {
  provider: PaymentProvider
  event: string
  paymentReference: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  amount?: number
  metadata?: Record<string, unknown>
}

// ================================
// STRIPE
// ================================
async function initStripePayment(config: PaymentConfig, params: PaymentInitParams): Promise<PaymentResult> {
  if (!config.secretKey) return { success: false, error: 'Stripe secret key not configured' }
  
  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${params.callbackUrl}?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': params.callbackUrl,
        'customer_email': params.customerEmail,
        'line_items[0][price_data][currency]': params.currency.toLowerCase(),
        'line_items[0][price_data][product_data][name]': `Order ${params.orderNumber}`,
        'line_items[0][price_data][unit_amount]': String(params.amount),
        'line_items[0][quantity]': '1',
        'metadata[orderId]': params.orderId,
        'metadata[orderNumber]': params.orderNumber,
      }).toString(),
    })

    const data = await response.json()
    if (data.id && data.url) {
      return { success: true, paymentReference: data.id, redirectUrl: data.url }
    }
    return { success: false, error: data.error?.message || 'Failed to create Stripe session' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Stripe error' }
  }
}

// ================================
// PAYSTACK
// ================================
async function initPaystackPayment(config: PaymentConfig, params: PaymentInitParams): Promise<PaymentResult> {
  if (!config.secretKey) return { success: false, error: 'Paystack secret key not configured' }
  
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.customerEmail,
        amount: params.amount, // Paystack expects amount in kobo (smallest unit)
        currency: params.currency,
        reference: `${params.orderNumber}-${Date.now()}`,
        callback_url: params.callbackUrl,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          customerName: params.customerName,
          ...params.metadata,
        },
      }),
    })

    const data = await response.json()
    if (data.status && data.data?.authorization_url) {
      return { 
        success: true, 
        paymentReference: data.data.reference, 
        redirectUrl: data.data.authorization_url 
      }
    }
    return { success: false, error: data.message || 'Failed to initialize Paystack payment' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Paystack error' }
  }
}

// ================================
// FLUTTERWAVE
// ================================
async function initFlutterwavePayment(config: PaymentConfig, params: PaymentInitParams): Promise<PaymentResult> {
  if (!config.secretKey) return { success: false, error: 'Flutterwave secret key not configured' }
  
  try {
    const txRef = `FLW-${params.orderNumber}-${Date.now()}`
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: params.amount / 100, // Flutterwave expects full amount, not smallest unit
        currency: params.currency,
        redirect_url: params.callbackUrl,
        customer: {
          email: params.customerEmail,
          name: params.customerName,
        },
        customizations: {
          title: `Order ${params.orderNumber}`,
          description: params.description || `Payment for order ${params.orderNumber}`,
        },
        meta: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
        },
      }),
    })

    const data = await response.json()
    if (data.status === 'success' && data.data?.link) {
      return { success: true, paymentReference: txRef, redirectUrl: data.data.link }
    }
    return { success: false, error: data.message || 'Failed to initialize Flutterwave payment' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Flutterwave error' }
  }
}

// ================================
// LEMON SQUEEZY
// ================================
async function initLemonSqueezyPayment(config: PaymentConfig, params: PaymentInitParams): Promise<PaymentResult> {
  if (!config.secretKey || !config.storeId) return { success: false, error: 'LemonSqueezy API key or store ID not configured' }
  
  try {
    // LemonSqueezy works differently - typically uses pre-created products
    // For dynamic checkout, we create a checkout session
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: params.amount, // In cents
            checkout_data: {
              email: params.customerEmail,
              name: params.customerName,
              custom: {
                orderId: params.orderId,
                orderNumber: params.orderNumber,
              },
            },
            product_options: {
              name: `Order ${params.orderNumber}`,
              description: params.description,
              redirect_url: params.callbackUrl,
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: config.storeId } },
          },
        },
      }),
    })

    const data = await response.json()
    if (data.data?.attributes?.url) {
      return { 
        success: true, 
        paymentReference: data.data.id, 
        redirectUrl: data.data.attributes.url 
      }
    }
    return { success: false, error: data.errors?.[0]?.detail || 'Failed to create LemonSqueezy checkout' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'LemonSqueezy error' }
  }
}

// ================================
// MAIN PAYMENT SERVICE
// ================================
export async function initializePayment(config: PaymentConfig, params: PaymentInitParams): Promise<PaymentResult> {
  switch (config.provider) {
    case 'COD':
      // Cash on delivery - no payment needed
      return { success: true, paymentReference: `COD-${params.orderNumber}` }
    
    case 'STRIPE':
      return initStripePayment(config, params)
    
    case 'PAYSTACK':
      return initPaystackPayment(config, params)
    
    case 'FLUTTERWAVE':
      return initFlutterwavePayment(config, params)
    
    case 'LEMONSQUEEZY':
      return initLemonSqueezyPayment(config, params)
    
    default:
      return { success: false, error: `Unknown payment provider: ${config.provider}` }
  }
}

// ================================
// VERIFICATION HELPERS
// ================================
export async function verifyPaystackPayment(reference: string, secretKey: string): Promise<{ success: boolean; status?: string }> {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()
    return { success: data.data?.status === 'success', status: data.data?.status }
  } catch {
    return { success: false }
  }
}

export async function verifyFlutterwavePayment(transactionId: string, secretKey: string): Promise<{ success: boolean; status?: string }> {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()
    return { success: data.data?.status === 'successful', status: data.data?.status }
  } catch {
    return { success: false }
  }
}

export async function verifyStripeSession(sessionId: string, secretKey: string): Promise<{ success: boolean; status?: string }> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()
    return { success: data.payment_status === 'paid', status: data.payment_status }
  } catch {
    return { success: false }
  }
}

// Provider display info
export const paymentProviders: Record<PaymentProvider, { name: string; description: string; regions: string }> = {
  COD: { name: 'Cash on Delivery', description: 'Pay when you receive', regions: 'All' },
  STRIPE: { name: 'Stripe', description: 'Credit/Debit Cards', regions: 'US, EU, UK, AU, CA, etc.' },
  PAYSTACK: { name: 'Paystack', description: 'Cards, Bank, Mobile Money', regions: 'Nigeria, Ghana, South Africa, Kenya' },
  FLUTTERWAVE: { name: 'Flutterwave', description: 'Cards, Mobile Money, Bank', regions: 'Africa, UK, EU' },
  LEMONSQUEEZY: { name: 'Lemon Squeezy', description: 'Digital Products', regions: 'Global' },
}
