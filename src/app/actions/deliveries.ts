'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createDeliverySchema = z.object({
  salesOrderId: z.string().min(1),
  carrier: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  shippingCity: z.string().nullable().optional(),
  shippingCountry: z.string().nullable().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    sku: z.string().nullable().optional(),
    quantity: z.number().positive(),
  })).min(1),
  notes: z.string().nullable().optional(),
})

type CreateDeliveryInput = z.input<typeof createDeliverySchema>

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

async function generateDeliveryNumber(orgId: string): Promise<string> {
  const last = await prisma.delivery.findFirst({
    where: { organizationId: orgId },
    orderBy: { deliveryNumber: 'desc' },
    select: { deliveryNumber: true }
  })
  if (!last) return 'DEL-000001'
  const lastNum = parseInt(last.deliveryNumber.replace('DEL-', '')) || 0
  return `DEL-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getDeliveries() {
  const { orgId } = await getOrganization()
  return prisma.delivery.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { 
      salesOrder: { select: { orderNumber: true, customer: { select: { companyName: true } } } },
      _count: { select: { items: true } }
    }
  })
}

export async function createDelivery(input: CreateDeliveryInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createDeliverySchema.parse(input)
  const deliveryNumber = await generateDeliveryNumber(orgId)

  const delivery = await prisma.delivery.create({
    data: {
      deliveryNumber,
      salesOrderId: validated.salesOrderId,
      carrier: validated.carrier,
      trackingNumber: validated.trackingNumber,
      shippingAddress: validated.shippingAddress,
      shippingCity: validated.shippingCity,
      shippingCountry: validated.shippingCountry,
      notes: validated.notes,
      organizationId: orgId,
      createdBy: userId,
      items: {
        create: validated.items.map(item => ({
          description: item.description,
          sku: item.sku,
          quantity: new Decimal(item.quantity),
        }))
      }
    },
    include: { items: true }
  })

  // Update sales order status if creating a delivery
  await prisma.salesOrder.update({
    where: { id: validated.salesOrderId },
    data: { status: 'SHIPPED', updatedBy: userId }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Delivery', entityId: delivery.id, newValues: delivery as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/sales/shipments')
  return delivery
}

export async function updateDeliveryStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.delivery.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Delivery not found')

  const updateData: Record<string, unknown> = { status, updatedBy: userId }
  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date()
    // Also update the sales order
    await prisma.salesOrder.update({
      where: { id: existing.salesOrderId },
      data: { status: 'DELIVERED', updatedBy: userId }
    })
  }

  const delivery = await prisma.delivery.update({ where: { id }, data: updateData })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Delivery', entityId: delivery.id, oldValues: { status: existing.status }, newValues: { status: delivery.status } })
  revalidatePath('/dashboard/sales/shipments')
  return delivery
}

export async function updateTracking(id: string, carrier: string, trackingNumber: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.delivery.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Delivery not found')

  const delivery = await prisma.delivery.update({
    where: { id },
    data: { carrier, trackingNumber, updatedBy: userId }
  })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Delivery', entityId: delivery.id, oldValues: { carrier: existing.carrier, trackingNumber: existing.trackingNumber }, newValues: { carrier, trackingNumber } })
  revalidatePath('/dashboard/sales/shipments')
  return delivery
}

export async function deleteDelivery(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.delivery.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Delivery not found')

  await prisma.delivery.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Delivery', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/sales/shipments')
  return { success: true }
}

export async function getDeliveryStats() {
  const { orgId } = await getOrganization()
  
  const [total, pending, inTransit, delivered] = await Promise.all([
    prisma.delivery.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.delivery.count({ where: { organizationId: orgId, status: 'PENDING', deletedAt: null } }),
    prisma.delivery.count({ where: { organizationId: orgId, status: 'IN_TRANSIT', deletedAt: null } }),
    prisma.delivery.count({ where: { organizationId: orgId, status: 'DELIVERED', deletedAt: null } }),
  ])

  return { total, pending, inTransit, delivered }
}
