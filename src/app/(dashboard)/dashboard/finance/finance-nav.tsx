'use client'

import { ModuleNav } from '@/components/shared/module-nav'
import { FileText, Receipt, CreditCard, DollarSign, PiggyBank } from 'lucide-react'

const financeNavItems = [
  { name: 'Chart of Accounts', href: '/dashboard/finance/accounts', icon: FileText },
  { name: 'Invoices', href: '/dashboard/finance/invoices', icon: Receipt },
  { name: 'Bills', href: '/dashboard/finance/bills', icon: CreditCard },
  { name: 'Payments', href: '/dashboard/finance/payments', icon: DollarSign },
  { name: 'Budgets', href: '/dashboard/finance/budgets', icon: PiggyBank },
]

export function FinanceModuleNav() {
  return <ModuleNav moduleName="Finance" items={financeNavItems} />
}
