'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const lineItemSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().nonnegative(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).default('ANNUAL'),
})

const createBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fiscalYear: z.number().int().min(2020).max(2100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  lineItems: z.array(lineItemSchema).min(1),
})

type CreateBudgetInput = z.input<typeof createBudgetSchema>

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

export async function getBudgets() {
  const { orgId } = await getOrganization()
  return prisma.budget.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { fiscalYear: 'desc' },
    include: { 
      lineItems: { include: { account: { select: { accountName: true, accountNumber: true } } } },
      _count: { select: { lineItems: true } }
    }
  })
}

export async function getBudget(id: string) {
  const { orgId } = await getOrganization()
  return prisma.budget.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: { lineItems: { include: { account: true } } }
  })
}

export async function createBudget(input: CreateBudgetInput) {
  const { userId, orgId } = await getOrganization()
  const validated = createBudgetSchema.parse(input)

  const totalAmount = validated.lineItems.reduce((sum, item) => sum + item.amount, 0)

  const budget = await prisma.budget.create({
    data: {
      name: validated.name,
      fiscalYear: validated.fiscalYear,
      startDate: validated.startDate,
      endDate: validated.endDate,
      totalAmount: new Decimal(totalAmount),
      organizationId: orgId,
      createdBy: userId,
      lineItems: {
        create: validated.lineItems.map(item => ({
          accountId: item.accountId,
          amount: new Decimal(item.amount),
          period: item.period,
        }))
      }
    },
    include: { lineItems: true }
  })

  await logAudit({ organizationId: orgId, userId, action: 'CREATE', entityType: 'Budget', entityId: budget.id, newValues: budget as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/finance/budgets')
  return budget
}

export async function updateBudgetStatus(id: string, status: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.budget.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Budget not found')

  const budget = await prisma.budget.update({
    where: { id },
    data: { status, updatedBy: userId }
  })

  await logAudit({ organizationId: orgId, userId, action: 'UPDATE', entityType: 'Budget', entityId: budget.id, oldValues: { status: existing.status }, newValues: { status: budget.status } })
  revalidatePath('/dashboard/finance/budgets')
  return budget
}

export async function deleteBudget(id: string) {
  const { userId, orgId } = await getOrganization()
  const existing = await prisma.budget.findFirst({ where: { id, organizationId: orgId, deletedAt: null } })
  if (!existing) throw new Error('Budget not found')

  await prisma.budget.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: userId } })
  await logAudit({ organizationId: orgId, userId, action: 'DELETE', entityType: 'Budget', entityId: id, oldValues: existing as unknown as Record<string, unknown> })
  revalidatePath('/dashboard/finance/budgets')
  return { success: true }
}

export async function getBudgetStats() {
  const { orgId } = await getOrganization()
  const currentYear = new Date().getFullYear()
  
  const [total, active, currentYearBudgets] = await Promise.all([
    prisma.budget.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.budget.count({ where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null } }),
    prisma.budget.aggregate({ 
      where: { organizationId: orgId, fiscalYear: currentYear, deletedAt: null },
      _sum: { totalAmount: true }
    }),
  ])

  return { 
    total, 
    active, 
    currentYearTotal: Number(currentYearBudgets._sum.totalAmount || 0) 
  }
}

// Budget vs Actual comparison
export async function getBudgetVsActual(budgetId: string) {
  const { orgId } = await getOrganization()
  
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, organizationId: orgId, deletedAt: null },
    include: { lineItems: { include: { account: true } } }
  })
  
  if (!budget) throw new Error('Budget not found')

  // Get actual transactions for each account in the budget period
  const comparison = await Promise.all(
    budget.lineItems.map(async (item) => {
      const actual = await prisma.transactionEntry.aggregate({
        where: {
          accountId: item.accountId,
          transaction: {
            organizationId: orgId,
            transactionDate: { gte: budget.startDate, lte: budget.endDate },
            deletedAt: null
          }
        },
        _sum: { debit: true, credit: true }
      })
      
      const actualAmount = Number(actual._sum.debit || 0) - Number(actual._sum.credit || 0)
      const budgetAmount = Number(item.amount)
      const variance = budgetAmount - actualAmount
      const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0

      return {
        accountId: item.accountId,
        accountName: item.account.accountName,
        accountNumber: item.account.accountNumber,
        budgeted: budgetAmount,
        actual: actualAmount,
        variance,
        variancePercent
      }
    })
  )

  return { budget, comparison }
}
