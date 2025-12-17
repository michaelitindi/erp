'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EMAIL', 'TRADE_SHOW', 'OTHER']),
  rating: z.enum(['HOT', 'WARM', 'COLD']).nullable().optional(),
  industry: z.string().nullable().optional(),
  estimatedValue: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type CreateLeadInput = z.input<typeof createLeadSchema>

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

async function generateLeadNumber(orgId: string): Promise<string> {
  const lastLead = await prisma.lead.findFirst({
    where: { organizationId: orgId },
    orderBy: { leadNumber: 'desc' },
    select: { leadNumber: true }
  })
  if (!lastLead) return 'LEAD-000001'
  const lastNum = parseInt(lastLead.leadNumber.replace('LEAD-', '')) || 0
  return `LEAD-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getLeads() {
  const { orgId } = await getOrganization()
  return prisma.lead.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { activities: true } } }
  })
}

export async function getLead(id: string) {
  const { orgId } = await getOrganization()
  return prisma.lead.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: { activities: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 } }
  })
}

export async function createLead(input: CreateLeadInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createLeadSchema.parse(input)
  const leadNumber = await generateLeadNumber(orgId)

  const lead = await prisma.lead.create({
    data: {
      ...validated,
      leadNumber,
      estimatedValue: validated.estimatedValue ? new Decimal(validated.estimatedValue) : null,
      organizationId: orgId,
      createdBy: userId,
      assignedTo: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Lead', entityId: lead.id, newValues: lead as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/crm/leads')
  return lead
}

export async function updateLeadStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.lead.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Lead not found')

  const lead = await prisma.lead.update({
    where: { id },
    data: { status, updatedBy: userId }
  })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Lead', entityId: lead.id, oldValues: { status: existing.status }, newValues: { status: lead.status } })
  revalidatePath('/dashboard/crm/leads')
  return lead
}

export async function convertLeadToCustomer(leadId: string) {
  const { userId, orgId } = await getOrganization()
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: orgId, deletedAt: null } })
  if (!lead) throw new Error('Lead not found')
  if (lead.status === 'CONVERTED') throw new Error('Lead already converted')

  // Generate customer number
  const lastCustomer = await prisma.customer.findFirst({
    where: { organizationId: orgId },
    orderBy: { customerNumber: 'desc' },
    select: { customerNumber: true }
  })
  const lastNum = lastCustomer ? parseInt(lastCustomer.customerNumber.replace('CUST-', '')) || 0 : 0
  const customerNumber = `CUST-${String(lastNum + 1).padStart(6, '0')}`

  // Create customer and update lead in transaction
  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        customerNumber,
        companyName: lead.companyName || `${lead.firstName} ${lead.lastName}`,
        contactPerson: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        customerType: lead.companyName ? 'BUSINESS' : 'INDIVIDUAL',
        organizationId: orgId,
        createdBy: userId,
      }
    })

    const updatedLead = await tx.lead.update({
      where: { id: leadId },
      data: { status: 'CONVERTED', convertedAt: new Date(), convertedToCustomerId: customer.id, updatedBy: userId }
    })

    return { customer, lead: updatedLead }
  })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Lead', entityId: leadId, oldValues: { status: lead.status }, newValues: { status: 'CONVERTED', convertedToCustomerId: result.customer.id } })
  revalidatePath('/dashboard/crm/leads')
  revalidatePath('/dashboard/crm/customers')
  return result
}

export async function deleteLead(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.lead.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Lead not found')

  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Lead', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/crm/leads')
  return { success: true }
}
