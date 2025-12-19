'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type CreateProjectInput = z.input<typeof createProjectSchema>

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

async function generateProjectNumber(orgId: string): Promise<string> {
  const last = await prisma.project.findFirst({
    where: { organizationId: orgId },
    orderBy: { projectNumber: 'desc' },
    select: { projectNumber: true }
  })
  if (!last) return 'PRJ-000001'
  const lastNum = parseInt(last.projectNumber.replace('PRJ-', '')) || 0
  return `PRJ-${String(lastNum + 1).padStart(6, '0')}`
}

export async function getProjects() {
  const { orgId } = await getOrganization()
  return prisma.project.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tasks: true, resources: true } } }
  })
}

export async function getProject(id: string) {
  const { orgId } = await getOrganization()
  return prisma.project.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: { tasks: { orderBy: { createdAt: 'asc' } }, resources: true }
  })
}

export async function createProject(input: CreateProjectInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createProjectSchema.parse(input)
  const projectNumber = await generateProjectNumber(orgId)

  const project = await prisma.project.create({
    data: {
      projectNumber,
      ...validated,
      budget: validated.budget ? new Decimal(validated.budget) : null,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Project', entityId: project.id, newValues: project as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/projects')
  return project
}

export async function updateProjectStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.project.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Project not found')

  const project = await prisma.project.update({ where: { id }, data: { status, updatedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Project', entityId: project.id, oldValues: { status: existing.status }, newValues: { status } })
  revalidatePath('/dashboard/projects')
  return project
}

export async function updateProjectProgress(id: string, progress: number) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.project.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Project not found')

  const project = await prisma.project.update({ where: { id }, data: { progress: Math.min(100, Math.max(0, progress)), updatedBy: userId } })
  revalidatePath('/dashboard/projects')
  return project
}

export async function deleteProject(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.project.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Project not found')

  await prisma.project.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Project', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/projects')
  return { success: true }
}

export async function getProjectStats() {
  const { orgId } = await getOrganization()
  
  const [total, active, completed] = await Promise.all([
    prisma.project.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.project.count({ where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null } }),
    prisma.project.count({ where: { organizationId: orgId, status: 'COMPLETED', deletedAt: null } }),
  ])

  return { total, active, completed }
}

// Task management
const createTaskSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.coerce.date().nullable().optional(),
  estimatedHours: z.number().nonnegative().nullable().optional(),
})

type CreateTaskInput = z.input<typeof createTaskSchema>

export async function createTask(input: CreateTaskInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createTaskSchema.parse(input)

  // Verify project belongs to org
  const project = await prisma.project.findFirst({ where: { id: validated.projectId, organizationId: orgId, deletedAt: null } })
  if (!project) throw new Error('Project not found')

  const task = await prisma.projectTask.create({
    data: {
      ...validated,
      estimatedHours: validated.estimatedHours ? new Decimal(validated.estimatedHours) : null,
      createdBy: userId,
    }
  })

  revalidatePath('/dashboard/projects')
  return task
}

export async function updateTaskStatus(id: string, status: string) {
  const { userId } = await getOrganization()
  const task = await prisma.projectTask.update({ where: { id }, data: { status } })
  revalidatePath('/dashboard/projects')
  return task
}
