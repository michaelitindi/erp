import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export type Permission = 
  | 'read:all' | 'write:all' | 'delete:all'
  | 'finance:read' | 'finance:write'
  | 'hr:read' | 'hr:write'
  | 'inventory:read' | 'inventory:write'
  | 'sales:read' | 'sales:write'
  | 'reports:read'

const rolePermissions: Record<string, Permission[]> = {
  'org:admin': ['read:all', 'write:all', 'delete:all'],
  'org:accountant': ['finance:read', 'finance:write', 'reports:read'],
  'org:hr_manager': ['hr:read', 'hr:write', 'reports:read'],
  'org:sales_manager': ['sales:read', 'sales:write', 'inventory:read', 'reports:read'],
  'org:employee': [],
}

export async function checkPermission(permission: Permission): Promise<boolean> {
  const { orgRole } = await auth()
  
  if (!orgRole) return false
  
  const permissions = rolePermissions[orgRole] || []
  
  // Admin has all permissions
  if (permissions.includes('read:all') || permissions.includes('write:all')) {
    return true
  }
  
  return permissions.includes(permission)
}

export async function requireAuth() {
  const { userId, orgId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: No user found')
  }
  
  if (!orgId) {
    throw new Error('Unauthorized: No organization selected')
  }
  
  return { userId, orgId }
}

export async function getOrCreateOrganization(clerkOrgId: string, name: string, slug: string) {
  let org = await prisma.organization.findUnique({
    where: { clerkOrgId }
  })
  
  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId,
        name,
        slug,
      }
    })
  }
  
  return org
}

export async function getCurrentOrganization() {
  const { orgId } = await auth()
  
  if (!orgId) return null
  
  return prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  })
}
