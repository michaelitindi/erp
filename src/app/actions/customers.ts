'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createCustomerSchema, type CreateCustomerInput } from '@/lib/validations/finance'

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

async function generateCustomerNumber(orgId: string): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    where: { organizationId: orgId },
    orderBy: { customerNumber: 'desc' },
    select: { customerNumber: true }
  })

  if (!lastCustomer) {
    return 'CUST-000001'
  }

  const lastNum = parseInt(lastCustomer.customerNumber.replace('CUST-', '')) || 0
  return `CUST-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getCustomers() {
  const { orgId } = await getOrganization()

  const customers = await prisma.customer.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { companyName: 'asc' },
    include: {
      _count: {
        select: { invoices: true }
      }
    }
  })

  return customers
}

export async function getCustomer(id: string) {
  const { orgId } = await getOrganization()

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      organizationId: orgId,
      deletedAt: null,
    },
    include: {
      invoices: {
        where: { deletedAt: null },
        orderBy: { invoiceDate: 'desc' },
        take: 10,
      }
    }
  })

  return customer
}

export async function createCustomer(input: CreateCustomerInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = createCustomerSchema.parse(input)
  const customerNumber = await generateCustomerNumber(orgId)

  const customer = await prisma.customer.create({
    data: {
      ...validated,
      customerNumber,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Customer',
    entityId: customer.id,
    newValues: customer as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/crm/customers')
  return customer
}

export async function deleteCustomer(id: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.customer.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Customer not found')
  }

  // Check for unpaid invoices
  const unpaidInvoices = await prisma.invoice.count({
    where: { 
      customerId: id, 
      status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
      deletedAt: null 
    }
  })

  if (unpaidInvoices > 0) {
    throw new Error('Cannot delete customer with unpaid invoices')
  }

  const customer = await prisma.customer.update({
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
    entityType: 'Customer',
    entityId: customer.id,
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/crm/customers')
  return { success: true }
}
