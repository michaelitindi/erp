'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createAssetSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.enum(['EQUIPMENT', 'VEHICLE', 'FURNITURE', 'IT', 'BUILDING']),
  location: z.string().nullable().optional(),
  purchaseDate: z.coerce.date(),
  purchasePrice: z.number().nonnegative(),
  salvageValue: z.number().nonnegative().default(0),
  usefulLifeMonths: z.number().int().positive().default(60),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).default('STRAIGHT_LINE'),
  warrantyExpiry: z.coerce.date().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type CreateAssetInput = z.input<typeof createAssetSchema>

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

async function generateAssetNumber(orgId: string): Promise<string> {
  const last = await prisma.asset.findFirst({
    where: { organizationId: orgId },
    orderBy: { assetNumber: 'desc' },
    select: { assetNumber: true }
  })
  if (!last) return 'AST-000001'
  const lastNum = parseInt(last.assetNumber.replace('AST-', '')) || 0
  return `AST-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getAssets() {
  const { orgId } = await getOrganization()
  return prisma.asset.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { maintenanceRecords: true } } }
  })
}

export async function createAsset(input: CreateAssetInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createAssetSchema.parse(input)
  const assetNumber = await generateAssetNumber(orgId)

  const asset = await prisma.asset.create({
    data: {
      assetNumber,
      ...validated,
      purchasePrice: new Decimal(validated.purchasePrice),
      currentValue: new Decimal(validated.purchasePrice),
      salvageValue: new Decimal(validated.salvageValue || 0),
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Asset', entityId: asset.id, newValues: asset as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/assets')
  return asset
}

export async function updateAssetStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.asset.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Asset not found')

  const asset = await prisma.asset.update({ where: { id }, data: { status, updatedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Asset', entityId: asset.id, oldValues: { status: existing.status }, newValues: { status } })
  revalidatePath('/dashboard/assets')
  return asset
}

export async function deleteAsset(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.asset.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Asset not found')

  await prisma.asset.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Asset', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/assets')
  return { success: true }
}

export async function getAssetStats() {
  const { orgId } = await getOrganization()
  
  const [total, active, totalValue] = await Promise.all([
    prisma.asset.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.asset.count({ where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null } }),
    prisma.asset.aggregate({ where: { organizationId: orgId, deletedAt: null }, _sum: { currentValue: true } }),
  ])

  return { total, active, totalValue: Number(totalValue._sum.currentValue || 0) }
}

// Calculate depreciation for an asset
export async function calculateDepreciation(assetId: string) {
  const { userId, orgId } = await getOrganization()
  const asset = await prisma.asset.findFirst({ where: { id: assetId, organizationId: orgId, deletedAt: null } })
  if (!asset) throw new Error('Asset not found')

  const purchasePrice = Number(asset.purchasePrice)
  const salvageValue = Number(asset.salvageValue)
  const usefulLife = asset.usefulLifeMonths
  const monthlyDepreciation = (purchasePrice - salvageValue) / usefulLife

  // Get latest depreciation record
  const lastRecord = await prisma.assetDepreciation.findFirst({
    where: { assetId },
    orderBy: { period: 'desc' }
  })

  const now = new Date()
  const period = new Date(now.getFullYear(), now.getMonth(), 1)
  const accumulatedPrev = lastRecord ? Number(lastRecord.accumulatedDepreciation) : 0
  const accumulated = Math.min(accumulatedPrev + monthlyDepreciation, purchasePrice - salvageValue)
  const bookValue = purchasePrice - accumulated

  const record = await prisma.assetDepreciation.create({
    data: {
      assetId,
      period,
      depreciationAmount: new Decimal(monthlyDepreciation),
      accumulatedDepreciation: new Decimal(accumulated),
      bookValue: new Decimal(bookValue),
      createdBy: userId,
    }
  })

  // Update asset current value
  await prisma.asset.update({ where: { id: assetId }, data: { currentValue: new Decimal(bookValue), updatedBy: userId } })

  revalidatePath('/dashboard/assets')
  return record
}
