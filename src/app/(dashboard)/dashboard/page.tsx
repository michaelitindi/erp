import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { 
  Receipt, 
  Users, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

async function getStats(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId }
  })
  
  if (!org) return null

  const [
    invoiceCount,
    customerCount,
    pendingInvoices,
    paidInvoices,
  ] = await Promise.all([
    prisma.invoice.count({ 
      where: { organizationId: org.id, deletedAt: null } 
    }),
    prisma.customer.count({ 
      where: { organizationId: org.id, deletedAt: null } 
    }),
    prisma.invoice.aggregate({
      where: { 
        organizationId: org.id, 
        status: { in: ['DRAFT', 'SENT'] },
        deletedAt: null 
      },
      _sum: { totalAmount: true }
    }),
    prisma.invoice.aggregate({
      where: { 
        organizationId: org.id, 
        status: 'PAID',
        deletedAt: null 
      },
      _sum: { totalAmount: true }
    }),
  ])

  return {
    invoiceCount,
    customerCount,
    pendingAmount: Number(pendingInvoices._sum.totalAmount || 0),
    paidAmount: Number(paidInvoices._sum.totalAmount || 0),
  }
}

export default async function DashboardPage() {
  const { orgId } = await auth()
  
  if (!orgId) {
    redirect('/')
  }

  const stats = await getStats(orgId)

  const cards = [
    {
      title: 'Total Revenue',
      value: stats ? `$${stats.paidAmount.toLocaleString()}` : '$0',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Pending Invoices',
      value: stats ? `$${stats.pendingAmount.toLocaleString()}` : '$0',
      change: '-3.2%',
      trend: 'down',
      icon: Receipt,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Total Customers',
      value: stats?.customerCount.toString() || '0',
      change: '+8.1%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Invoice Count',
      value: stats?.invoiceCount.toString() || '0',
      change: '+15.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Welcome to your ERP dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg bg-gradient-to-br ${card.color} p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                card.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {card.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {card.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">{card.title}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <a
            href="/dashboard/finance/invoices/new"
            className="flex items-center gap-3 rounded-lg border border-slate-600 bg-slate-700/50 p-4 transition-colors hover:bg-slate-700"
          >
            <Receipt className="h-5 w-5 text-blue-400" />
            <span className="text-white">Create Invoice</span>
          </a>
          <a
            href="/dashboard/crm/customers/new"
            className="flex items-center gap-3 rounded-lg border border-slate-600 bg-slate-700/50 p-4 transition-colors hover:bg-slate-700"
          >
            <Users className="h-5 w-5 text-purple-400" />
            <span className="text-white">Add Customer</span>
          </a>
          <a
            href="/dashboard/finance/bills/new"
            className="flex items-center gap-3 rounded-lg border border-slate-600 bg-slate-700/50 p-4 transition-colors hover:bg-slate-700"
          >
            <Receipt className="h-5 w-5 text-orange-400" />
            <span className="text-white">Enter Bill</span>
          </a>
          <a
            href="/dashboard/reports"
            className="flex items-center gap-3 rounded-lg border border-slate-600 bg-slate-700/50 p-4 transition-colors hover:bg-slate-700"
          >
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="text-white">View Reports</span>
          </a>
        </div>
      </div>
    </div>
  )
}
