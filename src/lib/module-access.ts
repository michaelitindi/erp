import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

/**
 * Check if the current user has access to a specific module.
 * Admins always have access. Members need the module in their allowedModules.
 * 
 * @param requiredModule - The module key to check (e.g., 'SALES', 'CRM', 'HR')
 * @returns true if user has access, redirects to /dashboard otherwise
 */
export async function checkModuleAccess(requiredModule: string): Promise<boolean> {
  const { userId, orgId, orgRole } = await auth()
  
  if (!userId || !orgId) {
    redirect('/sign-in')
  }
  
  // Admins always have access
  if (isAdmin(orgRole)) {
    return true
  }
  
  // For members, check their allowed modules
  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, enabledModules: true }
  })
  
  if (!org) {
    redirect('/dashboard')
  }
  
  // Check if module is enabled for organization
  if (!org.enabledModules.includes(requiredModule)) {
    redirect('/dashboard')
  }
  
  // Check if employee has access to this module
  const employee = await prisma.employee.findFirst({
    where: { 
      organizationId: org.id, 
      clerkUserId: userId,
      deletedAt: null 
    },
    select: { allowedModules: true }
  })
  
  if (!employee || !employee.allowedModules.includes(requiredModule)) {
    redirect('/dashboard')
  }
  
  return true
}

/**
 * Check if member has any modules assigned (not pending setup).
 * Returns false and redirects if no modules assigned.
 */
export async function checkNotPendingSetup(): Promise<boolean> {
  const { userId, orgId, orgRole } = await auth()
  
  if (!userId || !orgId) {
    redirect('/sign-in')
  }
  
  // Admins are never in pending setup
  if (isAdmin(orgRole)) {
    return true
  }
  
  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true }
  })
  
  if (!org) {
    redirect('/dashboard')
  }
  
  const employee = await prisma.employee.findFirst({
    where: { 
      organizationId: org.id, 
      clerkUserId: userId,
      deletedAt: null 
    },
    select: { allowedModules: true }
  })
  
  // If no modules assigned, redirect to dashboard (pending setup screen)
  if (!employee || employee.allowedModules.length === 0) {
    redirect('/dashboard')
  }
  
  return true
}
