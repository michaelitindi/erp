import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Download,
} from 'lucide-react'

async function getReportData(clerkOrgId: string) {
  const org = await prisma.organization.findUnique({ where: { clerkOrgId } })
  if (!org) return null

  const [
    totalRevenue,
    totalExpenses,
    invoiceStats,
    billStats,
    topCustomers,
    topVendors,
    accountBalances,
  ] = await Promise.all([
    // Total revenue (paid invoices)
    prisma.invoice.aggregate({
      where: { organizationId: org.id, status: 'PAID', deletedAt: null },
      _sum: { totalAmount: true }
    }),
    // Total expenses (paid bills)
    prisma.bill.aggregate({
      where: { organizationId: org.id, status: 'PAID', deletedAt: null },
      _sum: { totalAmount: true }
    }),
    // Invoice stats
    prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId: org.id, deletedAt: null },
      _count: true,
      _sum: { totalAmount: true }
    }),
    // Bill stats
    prisma.bill.groupBy({
      by: ['status'],
      where: { organizationId: org.id, deletedAt: null },
      _count: true,
      _sum: { totalAmount: true }
    }),
    // Top customers by revenue
    prisma.invoice.groupBy({
      by: ['customerId'],
      where: { organizationId: org.id, status: 'PAID', deletedAt: null },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    // Top vendors by spending
    prisma.bill.groupBy({
      by: ['vendorId'],
      where: { organizationId: org.id, status: 'PAID', deletedAt: null },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    // Account balances by type
    prisma.account.groupBy({
      by: ['accountType'],
      where: { organizationId: org.id, deletedAt: null },
      _sum: { balance: true },
    }),
  ])

  // Get customer and vendor details
  const customerIds = topCustomers.map(c => c.customerId)
  const vendorIds = topVendors.map(v => v.vendorId)
  
  const [customers, vendors] = await Promise.all([
    prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, companyName: true } }),
    prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, companyName: true } }),
  ])

  return {
    revenue: Number(totalRevenue._sum.totalAmount || 0),
    expenses: Number(totalExpenses._sum.totalAmount || 0),
    profit: Number(totalRevenue._sum.totalAmount || 0) - Number(totalExpenses._sum.totalAmount || 0),
    invoiceStats,
    billStats,
    topCustomers: topCustomers.map(c => ({
      ...c,
      companyName: customers.find(cust => cust.id === c.customerId)?.companyName || 'Unknown'
    })),
    topVendors: topVendors.map(v => ({
      ...v,
      companyName: vendors.find(vend => vend.id === v.vendorId)?.companyName || 'Unknown'
    })),
    accountBalances,
  }
}

export default async function ReportsPage() {
  const { orgId } = await auth()
  if (!orgId) redirect('/')

  const data = await getReportData(orgId)

  const profitMargin = data && data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
          <p className="text-slate-400">Overview of your financial performance</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">
          <Download className="h-4 w-4" />Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-3"><TrendingUp className="h-6 w-6 text-green-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">${data?.revenue.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-3"><TrendingDown className="h-6 w-6 text-red-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">${data?.expenses.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3"><DollarSign className="h-6 w-6 text-blue-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Net Profit</p>
              <p className={`text-2xl font-bold ${(data?.profit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>${data?.profit.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-3"><PieChart className="h-6 w-6 text-purple-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-400">{profitMargin}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accounts Receivable */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Accounts Receivable</h2>
          </div>
          <div className="space-y-3">
            {data?.invoiceStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${stat.status === 'PAID' ? 'bg-green-400' : stat.status === 'SENT' ? 'bg-blue-400' : stat.status === 'OVERDUE' ? 'bg-red-400' : 'bg-slate-400'}`}></span>
                  <span className="text-sm text-white capitalize">{stat.status.toLowerCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">${Number(stat._sum.totalAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{stat._count} invoices</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts Payable */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Accounts Payable</h2>
          </div>
          <div className="space-y-3">
            {data?.billStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${stat.status === 'PAID' ? 'bg-green-400' : stat.status === 'APPROVED' ? 'bg-blue-400' : stat.status === 'OVERDUE' ? 'bg-red-400' : 'bg-slate-400'}`}></span>
                  <span className="text-sm text-white capitalize">{stat.status.toLowerCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">${Number(stat._sum.totalAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{stat._count} bills</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Top Customers by Revenue</h2>
          </div>
          <div className="space-y-3">
            {data?.topCustomers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            ) : (
              data?.topCustomers.map((c, i) => (
                <div key={c.customerId} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-400">{i + 1}</span>
                    <span className="text-sm text-white">{c.companyName}</span>
                  </div>
                  <span className="text-sm font-medium text-green-400">${Number(c._sum.totalAmount || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Top Vendors by Spending</h2>
          </div>
          <div className="space-y-3">
            {data?.topVendors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            ) : (
              data?.topVendors.map((v, i) => (
                <div key={v.vendorId} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-medium text-orange-400">{i + 1}</span>
                    <span className="text-sm text-white">{v.companyName}</span>
                  </div>
                  <span className="text-sm font-medium text-red-400">${Number(v._sum.totalAmount || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
