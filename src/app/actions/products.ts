'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  type: z.enum(['PHYSICAL', 'SERVICE', 'DIGITAL']).default('PHYSICAL'),
  unit: z.string().default('EACH'),
  costPrice: z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
  reorderQuantity: z.number().int().nonnegative().default(0),
  barcode: z.string().nullable().optional(),
})

type CreateProductInput = z.input<typeof createProductSchema>

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

export async function getProducts() {
  const { orgId } = await getOrganization()
  return prisma.product.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { name: 'asc' },
    include: { stockLevels: { include: { warehouse: { select: { name: true } } } } }
  })
}

export async function getProduct(id: string) {
  const { orgId } = await getOrganization()
  return prisma.product.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: { stockLevels: { include: { warehouse: true } }, stockMovements: { orderBy: { movementDate: 'desc' }, take: 20 } }
  })
}

export async function createProduct(input: CreateProductInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createProductSchema.parse(input)

  const product = await prisma.product.create({
    data: {
      ...validated,
      costPrice: new Decimal(validated.costPrice),
      sellingPrice: new Decimal(validated.sellingPrice),
      taxRate: new Decimal(validated.taxRate),
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Product', entityId: product.id, newValues: product as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/inventory/products')
  return product
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.product.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Product not found')

  const updateData: Record<string, unknown> = { updatedBy: userId }
  if (input.name) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.category !== undefined) updateData.category = input.category
  if (input.costPrice !== undefined) updateData.costPrice = new Decimal(input.costPrice)
  if (input.sellingPrice !== undefined) updateData.sellingPrice = new Decimal(input.sellingPrice)
  if (input.reorderLevel !== undefined) updateData.reorderLevel = input.reorderLevel

  const product = await prisma.product.update({ where: { id }, data: updateData })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Product', entityId: product.id, oldValues: existing as unknown as Record<string, unknown>, newValues: product as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/inventory/products')
  return product
}

export async function deleteProduct(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.product.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Product not found')

  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId, isActive: false } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Product', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/inventory/products')
  return { success: true }
}

export async function getProductStats() {
  const { orgId } = await getOrganization()
  
  const [total, active, lowStock] = await Promise.all([
    prisma.product.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.product.count({ where: { organizationId: orgId, deletedAt: null, isActive: true } }),
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT p.id) as count FROM "Product" p 
      LEFT JOIN "StockLevel" sl ON p.id = sl."productId" 
      WHERE p."organizationId" = ${orgId} AND p."deletedAt" IS NULL 
      AND (sl.quantity IS NULL OR sl.quantity <= p."reorderLevel")
    ` as Promise<[{ count: bigint }]>,
  ])

  return { total, active, lowStock: Number(lowStock[0]?.count || 0) }
}

// Get products that need reordering
export async function getLowStockAlerts() {
  const { orgId } = await getOrganization()
  
  // Get all products with their total stock and check against reorder level
  const products = await prisma.product.findMany({
    where: { organizationId: orgId, deletedAt: null, isActive: true, reorderLevel: { gt: 0 } },
    include: { 
      stockLevels: { select: { quantity: true } },
    }
  })

  const alerts = products
    .map(p => {
      const totalStock = p.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0)
      const isLow = totalStock <= p.reorderLevel
      const isCritical = totalStock === 0
      return { 
        ...p, 
        totalStock, 
        isLow, 
        isCritical,
        deficit: p.reorderLevel - totalStock,
        suggestedOrder: p.reorderQuantity > 0 ? p.reorderQuantity : p.reorderLevel * 2
      }
    })
    .filter(p => p.isLow)
    .sort((a, b) => a.deficit - b.deficit) // Most critical first

  return alerts
}
