'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  filePath: z.string().min(1),
  category: z.enum(['CONTRACT', 'INVOICE', 'REPORT', 'POLICY', 'OTHER']).nullable().optional(),
  tags: z.string().nullable().optional(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
})

type CreateDocumentInput = z.input<typeof createDocumentSchema>

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

export async function getDocuments() {
  const { orgId } = await getOrganization()
  return prisma.document.findMany({
    where: { organizationId: orgId, status: { not: 'DELETED' } },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { versions: true } } }
  })
}

export async function createDocument(input: CreateDocumentInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createDocumentSchema.parse(input)

  const document = await prisma.document.create({
    data: {
      ...validated,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Document', entityId: document.id, newValues: document as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/documents')
  return document
}

export async function archiveDocument(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.document.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) throw new Error('Document not found')

  const document = await prisma.document.update({ where: { id }, data: { status: 'ARCHIVED', updatedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Document', entityId: document.id, oldValues: { status: existing.status }, newValues: { status: 'ARCHIVED' } })
  revalidatePath('/dashboard/documents')
  return document
}

export async function deleteDocument(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.document.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) throw new Error('Document not found')

  await prisma.document.update({ where: { id }, data: { status: 'DELETED', updatedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Document', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/documents')
  return { success: true }
}

export async function getDocumentStats() {
  const { orgId } = await getOrganization()
  
  const [total, active, archived] = await Promise.all([
    prisma.document.count({ where: { organizationId: orgId, status: { not: 'DELETED' } } }),
    prisma.document.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
    prisma.document.count({ where: { organizationId: orgId, status: 'ARCHIVED' } }),
  ])

  return { total, active, archived }
}
