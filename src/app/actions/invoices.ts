'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createInvoiceSchema, type CreateInvoiceInput } from '@/lib/validations/finance'
import { Decimal } from '@prisma/client/runtime/library'

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

async function generateInvoiceNumber(orgId: string): Promise<string> {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { organizationId: orgId },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true }
  })

  if (!lastInvoice) {
    return 'INV-000001'
  }

  const lastNum = parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) || 0
  return `INV-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getInvoices() {
  const { orgId } = await getOrganization()

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { invoiceDate: 'desc' },
    include: {
      customer: {
        select: { companyName: true, email: true }
      },
      _count: {
        select: { lineItems: true, payments: true }
      }
    }
  })

  return invoices
}

export async function getInvoice(id: string) {
  const { orgId } = await getOrganization()

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      organizationId: orgId,
      deletedAt: null,
    },
    include: {
      customer: true,
      lineItems: true,
      payments: {
        where: { deletedAt: null }
      }
    }
  })

  return invoice
}

export async function createInvoice(input: CreateInvoiceInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = createInvoiceSchema.parse(input)
  const invoiceNumber = await generateInvoiceNumber(orgId)

  // Calculate totals
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

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: validated.customerId,
      invoiceDate: validated.invoiceDate,
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
      customer: true,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Invoice',
    entityId: invoice.id,
    newValues: { ...invoice, lineItems: invoice.lineItems } as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/invoices')
  return invoice
}

export async function updateInvoiceStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Invoice not found')
  }

  const invoice = await prisma.invoice.update({
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
    entityType: 'Invoice',
    entityId: invoice.id,
    oldValues: { status: existing.status },
    newValues: { status: invoice.status },
  })

  revalidatePath('/dashboard/finance/invoices')
  return invoice
}

export async function deleteInvoice(id: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Invoice not found')
  }

  if (existing.status === 'PAID') {
    throw new Error('Cannot delete a paid invoice')
  }

  const invoice = await prisma.invoice.update({
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
    entityType: 'Invoice',
    entityId: invoice.id,
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/invoices')
  return { success: true }
}
