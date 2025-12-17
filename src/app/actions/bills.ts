'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const billLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100).default(0),
})

const createBillSchema = z.object({
  vendorId: z.string().min(1),
  billDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  lineItems: z.array(billLineItemSchema).min(1),
  notes: z.string().nullable().optional(),
})

type CreateBillInput = z.infer<typeof createBillSchema>

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

async function generateBillNumber(orgId: string): Promise<string> {
  const lastBill = await prisma.bill.findFirst({
    where: { organizationId: orgId },
    orderBy: { billNumber: 'desc' },
    select: { billNumber: true }
  })

  if (!lastBill) {
    return 'BILL-000001'
  }

  const lastNum = parseInt(lastBill.billNumber.replace('BILL-', '')) || 0
  return `BILL-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getBills() {
  const { orgId } = await getOrganization()

  const bills = await prisma.bill.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { billDate: 'desc' },
    include: {
      vendor: {
        select: { companyName: true, email: true }
      },
      _count: {
        select: { lineItems: true, payments: true }
      }
    }
  })

  return bills
}

export async function createBill(input: CreateBillInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = createBillSchema.parse(input)
  const billNumber = await generateBillNumber(orgId)

  let subtotal = 0
  let taxAmount = 0
  
  const lineItemsWithAmount = validated.lineItems.map(item => {
    const amount = item.quantity * item.unitPrice
    const tax = amount * (item.taxRate / 100)
    subtotal += amount
    taxAmount += tax
    return {
      ...item,
      quantity: new Decimal(item.quantity),
      unitPrice: new Decimal(item.unitPrice),
      taxRate: new Decimal(item.taxRate),
      amount: new Decimal(amount),
    }
  })

  const totalAmount = subtotal + taxAmount

  const bill = await prisma.bill.create({
    data: {
      billNumber,
      vendorId: validated.vendorId,
      billDate: validated.billDate,
      dueDate: validated.dueDate,
      subtotal: new Decimal(subtotal),
      taxAmount: new Decimal(taxAmount),
      totalAmount: new Decimal(totalAmount),
      notes: validated.notes,
      organizationId: orgId,
      createdBy: userId,
      lineItems: {
        create: lineItemsWithAmount
      }
    },
    include: {
      lineItems: true,
      vendor: true,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Bill',
    entityId: bill.id,
    newValues: { ...bill, lineItems: bill.lineItems } as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/bills')
  return bill
}

export async function updateBillStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.bill.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Bill not found')
  }

  const bill = await prisma.bill.update({
    where: { id },
    data: {
      status,
      updatedBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'UPDATE',
    entityType: 'Bill',
    entityId: bill.id,
    oldValues: { status: existing.status },
    newValues: { status: bill.status },
  })

  revalidatePath('/dashboard/finance/bills')
  return bill
}

export async function deleteBill(id: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.bill.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Bill not found')
  }

  if (existing.status === 'PAID') {
    throw new Error('Cannot delete a paid bill')
  }

  const bill = await prisma.bill.update({
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
    entityType: 'Bill',
    entityId: bill.id,
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/bills')
  return { success: true }
}
