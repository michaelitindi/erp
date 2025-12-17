import { prisma } from './prisma'
import { headers } from 'next/headers'
import { Prisma } from '@prisma/client'

interface AuditLogParams {
  organizationId: string
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'
  entityType: string
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

export async function logAudit(params: AuditLogParams) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues as Prisma.InputJsonValue ?? Prisma.JsonNull,
        newValues: params.newValues as Prisma.InputJsonValue ?? Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error)
  }
}
