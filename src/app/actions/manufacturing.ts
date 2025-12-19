'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createBOMSchema = z.object({
  name: z.string().min(1),
  productId: z.string().min(1),
  notes: z.string().nullable().optional(),
  components: z.array(z.object({
    description: z.string().min(1),
    productId: z.string().nullable().optional(),
    quantity: z.number().positive(),
    unit: z.string().default('EACH'),
    wastagePercent: z.number().min(0).max(100).default(0),
  })).min(1),
})

type CreateBOMInput = z.input<typeof createBOMSchema>

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

async function generateBOMNumber(orgId: string): Promise<string> {
  const last = await prisma.billOfMaterials.findFirst({
    where: { organizationId: orgId },
    orderBy: { bomNumber: 'desc' },
    select: { bomNumber: true }
  })
  if (!last) return 'BOM-000001'
  const lastNum = parseInt(last.bomNumber.replace('BOM-', '')) || 0
  return `BOM-${String(lastNum + 1).padStart(6, '0')}`
}

async function generateWONumber(orgId: string): Promise<string> {
  const last = await prisma.workOrder.findFirst({
    where: { organizationId: orgId },
    orderBy: { workOrderNumber: 'desc' },
    select: { workOrderNumber: true }
  })
  if (!last) return 'WO-000001'
  const lastNum = parseInt(last.workOrderNumber.replace('WO-', '')) || 0
  return `WO-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getBOMs() {
  const { orgId } = await getOrganization()
  return prisma.billOfMaterials.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { components: true, workOrders: true } } }
  })
}

export async function createBOM(input: CreateBOMInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createBOMSchema.parse(input)
  const bomNumber = await generateBOMNumber(orgId)

  const bom = await prisma.billOfMaterials.create({
    data: {
      bomNumber,
      name: validated.name,
      productId: validated.productId,
      notes: validated.notes,
      organizationId: orgId,
      createdBy: userId,
      components: {
        create: validated.components.map(c => ({
          description: c.description,
          productId: c.productId,
          quantity: new Decimal(c.quantity),
          unit: c.unit,
          wastagePercent: new Decimal(c.wastagePercent || 0),
        }))
      }
    },
    include: { components: true }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'BillOfMaterials', entityId: bom.id, newValues: bom as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/manufacturing')
  return bom
}

export async function updateBOMStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.billOfMaterials.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) throw new Error('BOM not found')

  const bom = await prisma.billOfMaterials.update({ where: { id }, data: { status, updatedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'BillOfMaterials', entityId: bom.id, oldValues: { status: existing.status }, newValues: { status } })
  revalidatePath('/dashboard/manufacturing')
  return bom
}

// Work Orders
export async function getWorkOrders() {
  const { orgId } = await getOrganization()
  return prisma.workOrder.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: { bom: { select: { bomNumber: true, name: true } } }
  })
}

const createWorkOrderSchema = z.object({
  bomId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  quantity: z.number().positive(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  plannedStart: z.coerce.date().nullable().optional(),
  plannedEnd: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type CreateWorkOrderInput = z.input<typeof createWorkOrderSchema>

export async function createWorkOrder(input: CreateWorkOrderInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createWorkOrderSchema.parse(input)
  const workOrderNumber = await generateWONumber(orgId)

  const workOrder = await prisma.workOrder.create({
    data: {
      workOrderNumber,
      bomId: validated.bomId,
      productId: validated.productId,
      quantity: new Decimal(validated.quantity),
      priority: validated.priority,
      plannedStart: validated.plannedStart,
      plannedEnd: validated.plannedEnd,
      notes: validated.notes,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'WorkOrder', entityId: workOrder.id, newValues: workOrder as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/manufacturing')
  return workOrder
}

export async function updateWorkOrderStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.workOrder.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) throw new Error('Work order not found')

  const updateData: Record<string, unknown> = { status, updatedBy: userId }
  if (status === 'IN_PROGRESS' && !existing.actualStart) updateData.actualStart = new Date()
  if (status === 'COMPLETED') updateData.actualEnd = new Date()

  const workOrder = await prisma.workOrder.update({ where: { id }, data: updateData })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'WorkOrder', entityId: workOrder.id, oldValues: { status: existing.status }, newValues: { status } })
  revalidatePath('/dashboard/manufacturing')
  return workOrder
}

export async function getManufacturingStats() {
  const { orgId } = await getOrganization()
  
  const [totalBOMs, activeBOMs, totalWOs, activeWOs] = await Promise.all([
    prisma.billOfMaterials.count({ where: { organizationId: orgId } }),
    prisma.billOfMaterials.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
    prisma.workOrder.count({ where: { organizationId: orgId } }),
    prisma.workOrder.count({ where: { organizationId: orgId, status: 'IN_PROGRESS' } }),
  ])

  return { totalBOMs, activeBOMs, totalWOs, activeWOs }
}
