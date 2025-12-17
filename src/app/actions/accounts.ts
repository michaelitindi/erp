'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createAccountSchema, updateAccountSchema, type CreateAccountInput, type UpdateAccountInput } from '@/lib/validations/finance'

async function getOrganization() {
  const { userId, orgId } = await auth()
  
  if (!userId || !orgId) {
    throw new Error('Unauthorized')
  }

  let org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  })

  if (!org) {
    // Create organization if it doesn't exist
    org = await prisma.organization.create({
      data: {
        clerkOrgId: orgId,
        name: 'My Organization',
        slug: orgId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      }
    })
  }

  return { userId, orgId: org.id, clerkOrgId: orgId }
}

export async function getAccounts() {
  const { orgId } = await getOrganization()

  const accounts = await prisma.account.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { accountNumber: 'asc' },
    include: {
      parent: {
        select: { accountNumber: true, accountName: true }
      },
      _count: {
        select: { children: true }
      }
    }
  })

  return accounts
}

export async function getAccount(id: string) {
  const { orgId } = await getOrganization()

  const account = await prisma.account.findFirst({
    where: {
      id,
      organizationId: orgId,
      deletedAt: null,
    },
    include: {
      parent: true,
      children: true,
    }
  })

  return account
}

export async function createAccount(input: CreateAccountInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = createAccountSchema.parse(input)

  // Check if account number already exists
  const existing = await prisma.account.findFirst({
    where: {
      organizationId: orgId,
      accountNumber: validated.accountNumber,
      deletedAt: null,
    }
  })

  if (existing) {
    throw new Error('Account number already exists')
  }

  const account = await prisma.account.create({
    data: {
      ...validated,
      organizationId: orgId,
      createdBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Account',
    entityId: account.id,
    newValues: account as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/accounts')
  return account
}

export async function updateAccount(input: UpdateAccountInput) {
  const { userId, orgId } = await getOrganization()
  
  const validated = updateAccountSchema.parse(input)
  const { id, ...data } = validated

  const existing = await prisma.account.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Account not found')
  }

  // Check if new account number conflicts with existing
  if (data.accountNumber && data.accountNumber !== existing.accountNumber) {
    const conflict = await prisma.account.findFirst({
      where: {
        organizationId: orgId,
        accountNumber: data.accountNumber,
        deletedAt: null,
        id: { not: id }
      }
    })
    if (conflict) {
      throw new Error('Account number already exists')
    }
  }

  const account = await prisma.account.update({
    where: { id },
    data: {
      ...data,
      updatedBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'UPDATE',
    entityType: 'Account',
    entityId: account.id,
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: account as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/accounts')
  return account
}

export async function deleteAccount(id: string) {
  const { userId, orgId } = await getOrganization()

  const existing = await prisma.account.findFirst({
    where: { id, organizationId: orgId, deletedAt: null }
  })

  if (!existing) {
    throw new Error('Account not found')
  }

  // Check if account has children
  const hasChildren = await prisma.account.count({
    where: { parentId: id, deletedAt: null }
  })

  if (hasChildren > 0) {
    throw new Error('Cannot delete account with sub-accounts')
  }

  // Soft delete
  const account = await prisma.account.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    }
  })

  await logAudit({
    organizationId: orgId,
    userId,
    action: 'DELETE',
    entityType: 'Account',
    entityId: account.id,
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/dashboard/finance/accounts')
  return { success: true }
}

// Generate default Chart of Accounts for new organizations
export async function seedDefaultAccounts() {
  const { userId, orgId } = await getOrganization()

  const existingAccounts = await prisma.account.count({
    where: { organizationId: orgId, deletedAt: null }
  })

  if (existingAccounts > 0) {
    return { message: 'Accounts already exist' }
  }

  const defaultAccounts = [
    // Assets (1000-1999)
    { accountNumber: '1000', accountName: 'Cash and Cash Equivalents', accountType: 'ASSET' },
    { accountNumber: '1010', accountName: 'Checking Account', accountType: 'ASSET' },
    { accountNumber: '1020', accountName: 'Savings Account', accountType: 'ASSET' },
    { accountNumber: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET' },
    { accountNumber: '1200', accountName: 'Inventory', accountType: 'ASSET' },
    { accountNumber: '1500', accountName: 'Fixed Assets', accountType: 'ASSET' },
    { accountNumber: '1510', accountName: 'Equipment', accountType: 'ASSET' },
    { accountNumber: '1520', accountName: 'Accumulated Depreciation', accountType: 'ASSET' },
    
    // Liabilities (2000-2999)
    { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'LIABILITY' },
    { accountNumber: '2100', accountName: 'Accrued Expenses', accountType: 'LIABILITY' },
    { accountNumber: '2200', accountName: 'Short-term Loans', accountType: 'LIABILITY' },
    { accountNumber: '2500', accountName: 'Long-term Debt', accountType: 'LIABILITY' },
    
    // Equity (3000-3999)
    { accountNumber: '3000', accountName: 'Owner\'s Equity', accountType: 'EQUITY' },
    { accountNumber: '3100', accountName: 'Retained Earnings', accountType: 'EQUITY' },
    { accountNumber: '3200', accountName: 'Common Stock', accountType: 'EQUITY' },
    
    // Revenue (4000-4999)
    { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'REVENUE' },
    { accountNumber: '4100', accountName: 'Service Revenue', accountType: 'REVENUE' },
    { accountNumber: '4200', accountName: 'Interest Income', accountType: 'REVENUE' },
    { accountNumber: '4900', accountName: 'Other Income', accountType: 'REVENUE' },
    
    // Expenses (5000-5999)
    { accountNumber: '5000', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE' },
    { accountNumber: '5100', accountName: 'Salaries and Wages', accountType: 'EXPENSE' },
    { accountNumber: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE' },
    { accountNumber: '5300', accountName: 'Utilities Expense', accountType: 'EXPENSE' },
    { accountNumber: '5400', accountName: 'Office Supplies', accountType: 'EXPENSE' },
    { accountNumber: '5500', accountName: 'Depreciation Expense', accountType: 'EXPENSE' },
    { accountNumber: '5600', accountName: 'Insurance Expense', accountType: 'EXPENSE' },
    { accountNumber: '5700', accountName: 'Marketing Expense', accountType: 'EXPENSE' },
    { accountNumber: '5900', accountName: 'Other Expenses', accountType: 'EXPENSE' },
  ]

  await prisma.account.createMany({
    data: defaultAccounts.map(acc => ({
      ...acc,
      organizationId: orgId,
      createdBy: userId,
    }))
  })

  revalidatePath('/dashboard/finance/accounts')
  return { success: true, count: defaultAccounts.length }
}
