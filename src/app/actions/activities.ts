'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  duration: z.number().nullable().optional(),
  leadId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
})

type CreateActivityInput = z.input<typeof createActivitySchema>

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

export async function getActivities(filters?: { leadId?: string; opportunityId?: string; customerId?: string }) {
  const { orgId } = await getOrganization()
  
  const where: Record<string, unknown> = { organizationId: orgId, deletedAt: null }
  if (filters?.leadId) where.leadId = filters.leadId
  if (filters?.opportunityId) where.opportunityId = filters.opportunityId
  if (filters?.customerId) where.customerId = filters.customerId
  
  return prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { leadNumber: true, firstName: true, lastName: true } },
      opportunity: { select: { opportunityNumber: true, name: true } },
      customer: { select: { customerNumber: true, companyName: true } },
    },
    take: 50,
  })
}

export async function createActivity(input: CreateActivityInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createActivitySchema.parse(input)

  const activity = await prisma.activity.create({
    data: {
      ...validated,
      organizationId: orgId,
      createdBy: userId,
      assignedTo: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Activity', entityId: activity.id, newValues: activity as unknown as Record<string, unknown> })
  
  // Revalidate related paths
  if (validated.leadId) revalidatePath('/dashboard/crm/leads')
  if (validated.opportunityId) revalidatePath('/dashboard/crm/opportunities')
  if (validated.customerId) revalidatePath('/dashboard/crm/customers')
  
  return activity
}

export async function completeActivity(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.activity.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Activity not found')

  const activity = await prisma.activity.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date(), updatedBy: userId }
  })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Activity', entityId: activity.id, oldValues: { status: existing.status }, newValues: { status: 'COMPLETED' } })
  return activity
}

export async function deleteActivity(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.activity.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Activity not found')

  await prisma.activity.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Activity', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  return { success: true }
}

// Get recent activities for dashboard
export async function getRecentActivities() {
  const { orgId } = await getOrganization()
  return prisma.activity.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      lead: { select: { leadNumber: true } },
      opportunity: { select: { opportunityNumber: true } },
      customer: { select: { companyName: true } },
    }
  })
}

// Get pending tasks for user
export async function getPendingTasks() {
  const { userId, orgId } = await getOrganization()
  return prisma.activity.findMany({
    where: { 
      organizationId: orgId, 
      deletedAt: null,
      status: 'PENDING',
      type: 'TASK',
      assignedTo: userId,
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  })
}
