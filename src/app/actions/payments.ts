'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createPaymentSchema = z.object({
  paymentDate: z.coerce.date(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CHECK', 'CREDIT_CARD', 'BANK_TRANSFER']),
  referenceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  invoiceId: z.string().nullable().optional(),
  billId: z.string().nullable().optional(),
})

type CreatePaymentInput = z.infer<typeof createPaymentSchema>

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

async function generatePaymentNumber(orgId: string): Promise<string> {
  const lastPayment = await prisma.payment.findFirst({
    where: { organizationId: orgId },
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true }
  })

  if (!lastPayment) {
    return 'PAY-000001'
  }

  const lastNum = parseInt(lastPayment.paymentNumber.replace('PAY-', '')) || 0
  return `PAY-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getPayments() {
  const { orgId } = await getOrganization()

  const payments = await prisma.payment.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { paymentDate: 'desc' },
    include: {
      invoice: {
        select: { invoiceNumber: true, customer: { select: { companyName: true } } }
      },
      bill: {
        select: { billNumber: true, vendor: { select: { companyName: true } } }
      }
    }
  })

  return payments
}

export async function createPayment(input: CreatePaymentInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = createPaymentSchema.parse(input)
  const paymentNumber = await generatePaymentNumber(orgId)

  // Create payment in a transaction to update invoice/bill paidAmount
  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        paymentNumber,
        paymentDate: validated.paymentDate,
        amount: new Decimal(validated.amount),
        paymentMethod: validated.paymentMethod,
        referenceNumber: validated.referenceNumber,
        notes: validated.notes,
        invoiceId: validated.invoiceId,
        billId: validated.billId,
        organizationId: orgId,
        createdBy: userId,
      }
    })

    // Update invoice paid amount if linked
    if (validated.invoiceId) {
      const invoice = await tx.invoice.findUnique({
        where: { id: validated.invoiceId },
        select: { paidAmount: true, totalAmount: true }
      })
      
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + validated.amount
        const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : 'SENT'
        
        await tx.invoice.update({
          where: { id: validated.invoiceId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            status: newStatus,
          }
        })
      }
    }

    // Update bill paid amount if linked
    if (validated.billId) {
      const bill = await tx.bill.findUnique({
        where: { id: validated.billId },
        select: { paidAmount: true, totalAmount: true }
      })
      
      if (bill) {
        const newPaidAmount = Number(bill.paidAmount) + validated.amount
        const newStatus = newPaidAmount >= Number(bill.totalAmount) ? 'PAID' : 'APPROVED'
        
        await tx.bill.update({
          where: { id: validated.billId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            status: newStatus,
          }
        })
      }
    }

    return newPayment
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Payment',
    entityId: payment.id,
    newValues: payment as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/payments')
  revalidatePath('/dashboard/finance/invoices')
  revalidatePath('/dashboard/finance/bills')
  return payment
}

export async function deletePayment(id: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.payment.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Payment not found')
  }

  // Reverse the payment in a transaction
  await prisma.$transaction(async (tx) => {
    // Reverse invoice paid amount if linked
    if (existing.invoiceId) {
      const invoice = await tx.invoice.findUnique({
        where: { id: existing.invoiceId },
        select: { paidAmount: true }
      })
      
      if (invoice) {
        const newPaidAmount = Math.max(0, Number(invoice.paidAmount) - Number(existing.amount))
        await tx.invoice.update({
          where: { id: existing.invoiceId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            status: newPaidAmount === 0 ? 'SENT' : 'SENT',
          }
        })
      }
    }

    // Reverse bill paid amount if linked
    if (existing.billId) {
      const bill = await tx.bill.findUnique({
        where: { id: existing.billId },
        select: { paidAmount: true }
      })
      
      if (bill) {
        const newPaidAmount = Math.max(0, Number(bill.paidAmount) - Number(existing.amount))
        await tx.bill.update({
          where: { id: existing.billId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            status: 'APPROVED',
          }
        })
      }
    }

    // Soft delete payment
    await tx.payment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    })
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'DELETE',
    entityType: 'Payment',
    entityId: id,
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/payments')
  revalidatePath('/dashboard/finance/invoices')
  revalidatePath('/dashboard/finance/bills')
  return { success: true }
}
