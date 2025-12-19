'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

async function getOrganization() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) throw new Error('Unauthorized')
  
  let org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: orgId, name: 'My Organization', slug: orgId.toLowerCase().replace(/[^a-z0-9]/g, '-') }
    })
  }
  return { userId, orgId: org.id }
}

// Online Store management
const createStoreSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  primaryColor: z.string().default('#3B82F6'),
  currency: z.string().default('USD'),
  // Payment provider config
  paymentProvider: z.enum(['COD', 'STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'LEMONSQUEEZY']).default('COD'),
  stripePublicKey: z.string().nullable().optional(),
  stripeSecretKey: z.string().nullable().optional(),
  paystackPublicKey: z.string().nullable().optional(),
  paystackSecretKey: z.string().nullable().optional(),
  flutterwavePublicKey: z.string().nullable().optional(),
  flutterwaveSecretKey: z.string().nullable().optional(),
  lemonSqueezyApiKey: z.string().nullable().optional(),
  lemonSqueezyStoreId: z.string().nullable().optional(),
})

type CreateStoreInput = z.input<typeof createStoreSchema>

export async function getStores() {
  const { orgId } = await getOrganization()
  return prisma.onlineStore.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { products: true, orders: true } } }
  })
}

export async function createStore(input: CreateStoreInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createStoreSchema.parse(input)

  const store = await prisma.onlineStore.create({
    data: {
      ...validated,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'OnlineStore', entityId: store.id, newValues: store as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/ecommerce')
  return store
}

export async function toggleStoreStatus(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.onlineStore.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) throw new Error('Store not found')

  const store = await prisma.onlineStore.update({ where: { id }, data: { isActive: !existing.isActive } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'OnlineStore', entityId: store.id, oldValues: { isActive: existing.isActive }, newValues: { isActive: store.isActive } })
  revalidatePath('/dashboard/ecommerce')
  return store
}

// Online Orders
export async function getOnlineOrders(storeId?: string) {
  const { orgId } = await getOrganization()
  
  const stores = await prisma.onlineStore.findMany({ where: { organizationId: orgId }, select: { id: true } })
  const storeIds = stores.map(s => s.id)

  return prisma.onlineOrder.findMany({
    where: { storeId: storeId ? storeId : { in: storeIds } },
    orderBy: { createdAt: 'desc' },
    include: { 
      store: { select: { name: true } },
      _count: { select: { items: true } }
    }
  })
}

export async function updateOnlineOrderStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  
  const order = await prisma.onlineOrder.findFirst({
    where: { id },
    include: { store: { select: { organizationId: true } } }
  })
  if (!order || order.store.organizationId !== orgId) throw new Error('Order not found')

  const updated = await prisma.onlineOrder.update({ where: { id }, data: { status } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'OnlineOrder', entityId: updated.id, oldValues: { status: order.status }, newValues: { status } })
  revalidatePath('/dashboard/ecommerce')
  return updated
}

// Stats
export async function getEcommerceStats() {
  const { orgId } = await getOrganization()
  
  const stores = await prisma.onlineStore.findMany({ where: { organizationId: orgId }, select: { id: true } })
  const storeIds = stores.map(s => s.id)

  const [totalStores, activeStores, totalProducts, totalOrders, pendingOrders, revenue] = await Promise.all([
    prisma.onlineStore.count({ where: { organizationId: orgId } }),
    prisma.onlineStore.count({ where: { organizationId: orgId, isActive: true } }),
    prisma.onlineProduct.count({ where: { storeId: { in: storeIds } } }),
    prisma.onlineOrder.count({ where: { storeId: { in: storeIds } } }),
    prisma.onlineOrder.count({ where: { storeId: { in: storeIds }, status: 'PENDING' } }),
    prisma.onlineOrder.aggregate({ where: { storeId: { in: storeIds }, paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
  ])

  return { 
    totalStores, 
    activeStores, 
    totalProducts, 
    totalOrders, 
    pendingOrders,
    revenue: Number(revenue._sum.totalAmount || 0) 
  }
}

// Online Products
const createOnlineProductSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  stockQuantity: z.number().int().min(0).default(0),
})

type CreateOnlineProductInput = z.input<typeof createOnlineProductSchema>

export async function getOnlineProducts(storeId?: string) {
  const { orgId } = await getOrganization()
  
  const stores = await prisma.onlineStore.findMany({ where: { organizationId: orgId }, select: { id: true } })
  const storeIds = stores.map(s => s.id)

  return prisma.onlineProduct.findMany({
    where: { storeId: storeId ? storeId : { in: storeIds } },
    orderBy: { createdAt: 'desc' },
    include: { store: { select: { name: true } }, category: { select: { name: true } } }
  })
}

export async function createOnlineProduct(input: CreateOnlineProductInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createOnlineProductSchema.parse(input)

  // Verify store belongs to org
  const store = await prisma.onlineStore.findFirst({ where: { id: validated.storeId, organizationId: orgId } })
  if (!store) throw new Error('Store not found')

  const product = await prisma.onlineProduct.create({
    data: {
      ...validated,
      price: new Decimal(validated.price),
      compareAtPrice: validated.compareAtPrice ? new Decimal(validated.compareAtPrice) : null,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'OnlineProduct', entityId: product.id, newValues: product as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/ecommerce')
  return product
}

export async function toggleProductActive(id: string) {
  const { userId, orgId } = await getOrganization()
  
  const product = await prisma.onlineProduct.findFirst({
    where: { id },
    include: { store: { select: { organizationId: true } } }
  })
  if (!product || product.store.organizationId !== orgId) throw new Error('Product not found')

  const updated = await prisma.onlineProduct.update({ where: { id }, data: { isActive: !product.isActive } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'OnlineProduct', entityId: updated.id, oldValues: { isActive: product.isActive }, newValues: { isActive: updated.isActive } })
  revalidatePath('/dashboard/ecommerce')
  return updated
}

export async function deleteOnlineProduct(id: string) {
  const { userId, orgId } = await getOrganization()
  
  const product = await prisma.onlineProduct.findFirst({
    where: { id },
    include: { store: { select: { organizationId: true } } }
  })
  if (!product || product.store.organizationId !== orgId) throw new Error('Product not found')

  await prisma.onlineProduct.delete({ where: { id } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'OnlineProduct', entityId: id, oldValues: product as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/ecommerce')
  return { success: true }
}

