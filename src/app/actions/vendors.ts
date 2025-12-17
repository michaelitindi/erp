'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createVendorSchema, type CreateVendorInput } from '@/lib/validations/finance'

async function getOrganization() {
  const { userId, orgId } = await auth()
  
  if (!userId || !orgId) {
    throw new Error('Unauthorized')
  }

  let org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  })

  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId: orgId,
        name: 'My Organization',
        slug: orgId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      }
    })
  }

  return { userId, orgId: org.id }
}

async function generateVendorNumber(orgId: string): Promise<string> {
  const lastVendor = await prisma.vendor.findFirst({
    where: { organizationId: orgId },
    orderBy: { vendorNumber: 'desc' },
    select: { vendorNumber: true }
  })

  if (!lastVendor) {
    return 'VND-000001'
  }

  const lastNum = parseInt(lastVendor.vendorNumber.replace('VND-', '')) || 0
  return `VND-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getVendors() {
  const { orgId } = await getOrganization()

  const vendors = await prisma.vendor.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { companyName: 'asc' },
    include: {
      _count: {
        select: { bills: true }
      }
    }
  })

  return vendors
}

export async function createVendor(input: CreateVendorInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = createVendorSchema.parse(input)
  const vendorNumber = await generateVendorNumber(orgId)

  const vendor = await prisma.vendor.create({
    data: {
      ...validated,
      vendorNumber,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Vendor',
    entityId: vendor.id,
    newValues: vendor as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/crm/vendors')
  return vendor
}

export async function deleteVendor(id: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.vendor.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Vendor not found')
  }

  const unpaidBills = await prisma.bill.count({
    where: { 
      vendorId: id, 
      status: { in: ['DRAFT', 'APPROVED', 'OVERDUE'] },
      deletedAt: null 
    }
  })

  if (unpaidBills > 0) {
    throw new Error('Cannot delete vendor with unpaid bills')
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'DELETE',
    entityType: 'Vendor',
    entityId: vendor.id,
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/crm/vendors')
  return { success: true }
}
