'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// Public store access - no auth required
export async function getPublicStore(slug: string) {
  return prisma.onlineStore.findFirst({
    where: { slug, isActive: true },
    include: {
      categories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { products: { where: { isActive: true } } } }
    }
  })
}

export async function getPublicProducts(storeSlug: string, options?: {
  categorySlug?: string
  search?: string
  featured?: boolean
  limit?: number
  offset?: number
}) {
  const store = await prisma.onlineStore.findFirst({ where: { slug: storeSlug, isActive: true } })
  if (!store) return { products: [], total: 0 }

  const where: Record<string, unknown> = { storeId: store.id, isActive: true }
  if (options?.featured) where.isFeatured = true
  if (options?.search) where.name = { contains: options.search, mode: 'insensitive' }
  if (options?.categorySlug) {
    const category = await prisma.onlineCategory.findFirst({ where: { storeId: store.id, slug: options.categorySlug } })
    if (category) where.categoryId = category.id
  }

  const [products, total] = await Promise.all([
    prisma.onlineProduct.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.onlineProduct.count({ where })
  ])

  return { products, total }
}

export async function getPublicProduct(storeSlug: string, productSlug: string) {
  const store = await prisma.onlineStore.findFirst({ where: { slug: storeSlug, isActive: true } })
  if (!store) return null

  return prisma.onlineProduct.findFirst({
    where: { storeId: store.id, slug: productSlug, isActive: true },
    include: { category: { select: { name: true, slug: true } } }
  })
}

export async function getPublicCategories(storeSlug: string) {
  const store = await prisma.onlineStore.findFirst({ where: { slug: storeSlug, isActive: true } })
  if (!store) return []

  return prisma.onlineCategory.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } }
  })
}

// Cart and checkout - no auth required
const checkoutSchema = z.object({
  storeSlug: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  shippingAddress: z.string().min(1),
  billingAddress: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
  notes: z.string().optional(),
})

type CheckoutInput = z.input<typeof checkoutSchema>

async function generateOrderNumber(storeId: string): Promise<string> {
  const last = await prisma.onlineOrder.findFirst({
    where: { storeId },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true }
  })
  if (!last) return 'ORD-000001'
  const lastNum = parseInt(last.orderNumber.replace('ORD-', '')) || 0
  return `ORD-${String(lastNum + 1).padStart(6, '0')}`
}

export async function createGuestOrder(input: CheckoutInput & { baseUrl: string }) {
  const validated = checkoutSchema.parse(input)
  
  const store = await prisma.onlineStore.findFirst({ where: { slug: validated.storeSlug, isActive: true } })
  if (!store) throw new Error('Store not found')

  // Fetch all products and validate
  const productIds = validated.items.map(i => i.productId)
  const products = await prisma.onlineProduct.findMany({
    where: { id: { in: productIds }, storeId: store.id, isActive: true }
  })

  if (products.length !== productIds.length) throw new Error('Some products are unavailable')

  // Calculate totals
  let subtotal = 0
  const orderItems = validated.items.map(item => {
    const product = products.find(p => p.id === item.productId)!
    const unitPrice = Number(product.price)
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice
    return {
      productId: product.id,
      productName: product.name,
      sku: product.slug,
      quantity: item.quantity,
      unitPrice: new Decimal(unitPrice),
      totalPrice: new Decimal(totalPrice),
    }
  })

  const taxRate = store.taxEnabled ? 0.16 : 0 // 16% tax
  const taxAmount = subtotal * taxRate
  const shippingAmount = store.shippingEnabled ? 10 : 0 // Flat $10 shipping
  const totalAmount = subtotal + taxAmount + shippingAmount

  const orderNumber = await generateOrderNumber(store.id)

  const order = await prisma.onlineOrder.create({
    data: {
      storeId: store.id,
      orderNumber,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      shippingAddress: validated.shippingAddress,
      billingAddress: validated.billingAddress || validated.shippingAddress,
      notes: validated.notes,
      subtotal: new Decimal(subtotal),
      taxAmount: new Decimal(taxAmount),
      shippingAmount: new Decimal(shippingAmount),
      discountAmount: new Decimal(0),
      totalAmount: new Decimal(totalAmount),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentProvider: store.paymentProvider,
      items: { create: orderItems }
    },
    include: { items: true }
  })

  // Update stock quantities
  for (const item of validated.items) {
    await prisma.onlineProduct.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: item.quantity } }
    })
  }

  // Initialize payment if not COD
  if (store.paymentProvider !== 'COD') {
    const { initializePayment } = await import('@/lib/payment')
    const provider = store.paymentProvider as 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE' | 'LEMONSQUEEZY'
    
    const paymentResult = await initializePayment(
      {
        provider,
        publicKey: store.stripePublicKey || store.paystackPublicKey || store.flutterwavePublicKey || undefined,
        secretKey: store.stripeSecretKey || store.paystackSecretKey || store.flutterwaveSecretKey || store.lemonSqueezyApiKey || undefined,
        storeId: store.lemonSqueezyStoreId || undefined,
      },
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Math.round(totalAmount * 100), // Convert to smallest unit
        currency: store.currency,
        customerEmail: validated.customerEmail,
        customerName: validated.customerName,
        callbackUrl: `${input.baseUrl}/store/${store.slug}/payment/callback?orderId=${order.id}`,
      }
    )

    if (paymentResult.success && paymentResult.paymentReference) {
      await prisma.onlineOrder.update({
        where: { id: order.id },
        data: {
          paymentReference: paymentResult.paymentReference,
          paymentUrl: paymentResult.redirectUrl,
        }
      })
      
      return { 
        ...order, 
        paymentRequired: true, 
        paymentUrl: paymentResult.redirectUrl,
        paymentReference: paymentResult.paymentReference
      }
    } else {
      // Payment initialization failed, mark order as failed
      await prisma.onlineOrder.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', notes: `Payment error: ${paymentResult.error}` }
      })
      throw new Error(paymentResult.error || 'Failed to initialize payment')
    }
  }

  // COD - no payment needed, mark as confirmed
  await prisma.onlineOrder.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED' }
  })

  // Send order confirmation email for COD
  try {
    const { sendOrderConfirmation, sendNewOrderNotification } = await import('@/lib/email')
    const trackingUrl = `${input.baseUrl}/store/${store.slug}/order/${order.orderNumber}`
    
    await sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      storeName: store.name,
      items: orderItems.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal,
      tax: taxAmount,
      shipping: shippingAmount,
      total: totalAmount,
      shippingAddress: validated.shippingAddress,
      paymentMethod: 'Cash on Delivery',
      trackingUrl,
    })

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await sendNewOrderNotification({
        orderNumber: order.orderNumber,
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        storeName: store.name,
        total: totalAmount,
        itemCount: orderItems.length,
        adminEmail,
        dashboardUrl: `${input.baseUrl}/dashboard/ecommerce`,
      })
    }
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError)
    // Don't fail the order if email fails
  }

  return { ...order, paymentRequired: false }
}

export async function getOrderByNumber(storeSlug: string, orderNumber: string) {
  const store = await prisma.onlineStore.findFirst({ where: { slug: storeSlug, isActive: true } })
  if (!store) return null

  return prisma.onlineOrder.findFirst({
    where: { storeId: store.id, orderNumber },
    include: { items: true, store: { select: { name: true, currency: true, paymentProvider: true } } }
  })
}

export async function getOrderById(orderId: string) {
  return prisma.onlineOrder.findFirst({
    where: { id: orderId },
    include: { items: true, store: { select: { name: true, currency: true, slug: true, paymentProvider: true } } }
  })
}

export async function verifyAndCompletePayment(orderId: string, paymentReference?: string) {
  const order = await prisma.onlineOrder.findFirst({
    where: { id: orderId },
    include: { store: true }
  })
  
  if (!order) throw new Error('Order not found')
  if (order.paymentStatus === 'PAID') return order // Already paid

  const store = order.store
  let paymentVerified = false

  // Verify payment based on provider
  if (store.paymentProvider === 'PAYSTACK' && store.paystackSecretKey && order.paymentReference) {
    const { verifyPaystackPayment } = await import('@/lib/payment')
    const result = await verifyPaystackPayment(order.paymentReference, store.paystackSecretKey)
    paymentVerified = result.success
  } else if (store.paymentProvider === 'FLUTTERWAVE' && store.flutterwaveSecretKey && paymentReference) {
    const { verifyFlutterwavePayment } = await import('@/lib/payment')
    const result = await verifyFlutterwavePayment(paymentReference, store.flutterwaveSecretKey)
    paymentVerified = result.success
  } else if (store.paymentProvider === 'STRIPE' && store.stripeSecretKey && order.paymentReference) {
    const { verifyStripeSession } = await import('@/lib/payment')
    const result = await verifyStripeSession(order.paymentReference, store.stripeSecretKey)
    paymentVerified = result.success
  } else if (store.paymentProvider === 'COD') {
    paymentVerified = true // COD always succeeds
  }

  if (paymentVerified) {
    return prisma.onlineOrder.update({
      where: { id: orderId },
      data: { 
        paymentStatus: 'PAID', 
        status: 'CONFIRMED',
        paidAt: new Date()
      },
      include: { items: true, store: { select: { name: true, currency: true, slug: true } } }
    })
  }

  return order
}

// Get store payment info for checkout
export async function getStorePaymentInfo(storeSlug: string) {
  const store = await prisma.onlineStore.findFirst({
    where: { slug: storeSlug, isActive: true },
    select: { 
      paymentProvider: true, 
      currency: true,
      name: true,
      stripePublicKey: true,
      paystackPublicKey: true,
      flutterwavePublicKey: true,
    }
  })
  return store
}

