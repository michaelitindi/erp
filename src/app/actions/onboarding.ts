'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getOrganizationWithModules() {
  const { orgId } = await auth()
  if (!orgId) return null

  return prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      enabledModules: true,
      onboardingComplete: true,
    }
  })
}

export async function completeOnboarding(modules: string[]) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) throw new Error('Unauthorized')

  // Ensure at least one module is selected
  if (modules.length === 0) {
    throw new Error('Please select at least one module')
  }

  // Get or create organization
  let org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  })

  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId: orgId,
        name: 'My Organization',
        slug: orgId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        enabledModules: modules,
        onboardingComplete: true,
      }
    })
  } else {
    org = await prisma.organization.update({
      where: { clerkOrgId: orgId },
      data: {
        enabledModules: modules,
        onboardingComplete: true,
      }
    })
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateEnabledModules(modules: string[]) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) throw new Error('Unauthorized')

  if (modules.length === 0) {
    throw new Error('Please select at least one module')
  }

  await prisma.organization.update({
    where: { clerkOrgId: orgId },
    data: { enabledModules: modules }
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}
