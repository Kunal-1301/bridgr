import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { LazyRender } from '../../components/ui/LazyRender'
import { Skeleton } from '../../components/ui/Skeleton'
import { adminKeys, getAdminMarginReport } from '../../api/admin'
import { Card, SectionHeader, inr, usd } from './adminUtils'

type MarginRow = {
  project: string
  clientPaid?: number
  workersPaid?: number
  grossMargin?: number
  netMarginPct?: number
  totalClientReceived?: number
  totalWorkerPayouts?: number
}

export const AdminMarginReportPage = () => {
  const report = useQuery({ queryKey: adminKeys.marginReport(), queryFn: getAdminMarginReport })
  const data = report.data as any

  const rows: MarginRow[] = useMemo(() => {
    if (!data) return []
    // Real API shape: { totalClientReceived, totalWorkerPayouts, grossMargin, marginPct, byProject: [{projectId, projectTitle, clientReceived, workerPayouts, margin}] }
    if (Array.isArray(data.byProject) && data.byProject.length > 0) {
      return data.byProject.map((row: any) => ({
        project: row.projectTitle ?? row.projectId ?? '—',
        clientPaid: row.clientReceived ?? 0,
        workersPaid: row.workerPayouts ?? 0,
        grossMargin: row.margin ?? 0,
        netMarginPct: row.clientReceived > 0 ? Math.round(((row.margin ?? 0) / row.clientReceived) * 100) : 0,
      }))
    }
    // Mock fallback shape: { rows: [...], chart: [...] }
    return data.rows ?? []
  }, [data])

  const chartData = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data.byProject) && data.byProject.length > 0) {
      return data.byProject.map((row: any) => ({
        project: (row.projectTitle ?? row.projectId ?? '—').slice(0, 14),
        revenue: row.clientReceived ?? 0,
        margin: row.margin ?? 0,
      }))
    }
    return data.chart ?? []
  }, [data])

  const totalClientReceived: number = data?.totalClientReceived ?? rows.reduce((s: number, r: MarginRow) => s + (r.clientPaid ?? 0), 0)
  const totalWorkerPayouts: number = data?.totalWorkerPayouts ?? rows.reduce((s: number, r: MarginRow) => s + (r.workersPaid ?? 0), 0)
  const grossMargin: number = data?.grossMargin ?? (totalClientReceived - totalWorkerPayouts)
  const marginPct: number = data?.marginPct ?? (totalClientReceived > 0 ? Math.round((grossMargin / totalClientReceived) * 100) : 0)

  const columns: ColumnDef<MarginRow>[] = [
    { accessorKey: 'project', header: 'Project' },
    { accessorKey: 'clientPaid', header: 'Client Received ($)', cell: ({ row }) => usd(row.original.clientPaid ?? 0) },
    { accessorKey: 'workersPaid', header: 'Workers Paid (₹)', cell: ({ row }) => inr(row.original.workersPaid ?? 0) },
    { accessorKey: 'grossMargin', header: 'Gross Margin ($)', cell: ({ row }) => usd(row.original.grossMargin ?? 0) },
    { accessorKey: 'netMarginPct', header: 'Margin %', cell: ({ row }) => `${row.original.netMarginPct ?? 0}%` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Margin Report"
        subtitle="Per-project profit analytics. All amounts are admin-only."
        action={<button className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Download className="h-4 w-4" /> Export CSV</button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Client Received" value={usd(totalClientReceived)} />
        <StatCard title="Total Worker Payouts" value={inr(totalWorkerPayouts)} />
        <StatCard title="Gross Margin" value={usd(grossMargin)} />
        <StatCard title="Margin %" value={`${marginPct}%`} />
      </div>

      <Card>
        <SectionHeader title="Revenue vs Margin by Project" />
        <LazyRender className="h-80 p-5" fallback={<Skeleton className="h-full w-full" />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis tickFormatter={(v) => `$${Number(v) / 1000}k`} />
              <Tooltip formatter={(v) => usd(Number(v))} />
              <Legend />
              <Bar dataKey="revenue" name="Client Revenue" fill="var(--bridgr-primary-800)" />
              <Bar dataKey="margin" name="Gross Margin" fill="var(--bridgr-accent-500)" />
            </BarChart>
          </ResponsiveContainer>
        </LazyRender>
      </Card>

      <DataTable columns={columns} data={rows} searchColumnId="project" />
    </div>
  )
}
