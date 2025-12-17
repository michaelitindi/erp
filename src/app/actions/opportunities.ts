'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createOpportunitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  customerId: z.string().min(1, 'Customer is required'),
  amount: z.number().positive('Amount must be positive'),
  probability: z.number().min(0).max(100).default(0),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  source: z.enum(['LEAD', 'REFERRAL', 'EXISTING_CUSTOMER', 'OTHER']).nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type CreateOpportunityInput = z.input<typeof createOpportunitySchema>

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

async function generateOpportunityNumber(orgId: string): Promise<string> {
  const lastOpp = await prisma.opportunity.findFirst({
    where: { organizationId: orgId },
    orderBy: { opportunityNumber: 'desc' },
    select: { opportunityNumber: true }
  })
  if (!lastOpp) return 'OPP-000001'
  const lastNum = parseInt(lastOpp.opportunityNumber.replace('OPP-', '')) || 0
  return `OPP-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getOpportunities() {
  const { orgId } = await getOrganization()
  return prisma.opportunity.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { 
      customer: { select: { companyName: true } },
      _count: { select: { activities: true } }
    }
  })
}

export async function getOpportunity(id: string) {
  const { orgId } = await getOrganization()
  return prisma.opportunity.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: { 
      customer: true,
      activities: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 }
    }
  })
}

export async function createOpportunity(input: CreateOpportunityInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createOpportunitySchema.parse(input)
  const opportunityNumber = await generateOpportunityNumber(orgId)

  const opportunity = await prisma.opportunity.create({
    data: {
      opportunityNumber,
      name: validated.name,
      customerId: validated.customerId,
      amount: new Decimal(validated.amount),
      probability: validated.probability ?? 0,
      expectedCloseDate: validated.expectedCloseDate,
      source: validated.source,
      description: validated.description,
      notes: validated.notes,
      organizationId: orgId,
      createdBy: userId,
      assignedTo: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Opportunity', entityId: opportunity.id, newValues: opportunity as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/crm/opportunities')
  return opportunity
}

export async function updateOpportunityStage(id: string, stage: string, lostReason?: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.opportunity.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Opportunity not found')

  const updateData: Record<string, unknown> = { stage, updatedBy: userId }
  if (stage === 'CLOSED_WON' || stage === 'CLOSED_LOST') {
    updateData.actualCloseDate = new Date()
  }
  if (stage === 'CLOSED_LOST' && lostReason) {
    updateData.lostReason = lostReason
  }

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data: updateData
  })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Opportunity', entityId: opportunity.id, oldValues: { stage: existing.stage }, newValues: { stage: opportunity.stage } })
  revalidatePath('/dashboard/crm/opportunities')
  return opportunity
}

export async function deleteOpportunity(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.opportunity.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Opportunity not found')

  await prisma.opportunity.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Opportunity', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/crm/opportunities')
  return { success: true }
}

// Pipeline summary for dashboard
export async function getOpportunityPipeline() {
  const { orgId } = await getOrganization()
  
  const stages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
  const pipeline = await prisma.opportunity.groupBy({
    by: ['stage'],
    where: { organizationId: orgId, deletedAt: null },
    _count: true,
    _sum: { amount: true }
  })

  return stages.map(stage => {
    const stageData = pipeline.find(p => p.stage === stage)
    return {
      stage,
      count: stageData?._count || 0,
      amount: Number(stageData?._sum.amount || 0)
    }
  })
}
