import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Briefcase, DollarSign, ListChecks, Users } from 'lucide-react'
import { AdminMetricCard } from '../../components/admin/AdminMetricCard'
import { Card, Button } from '../../design-system/components'
import { adminMetrics, pendingQueue, revenueSeries } from '../../features/admin/mockAdminData'

const usd = (value: number) => `$${value.toLocaleString('en-US')}`

export const AdminDashboardPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-page-title text-primary-800">Super Admin Dashboard</h1>
      <p className="mt-1 text-body text-neutral-600">Revenue, delivery, verification, and bridge controls.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label="Revenue MTD" value={usd(adminMetrics.revenueMtd)} icon={<DollarSign className="h-5 w-5" />} />
      <AdminMetricCard label="Gross margin" value={usd(adminMetrics.grossMargin)} helper="33% blended" icon={<DollarSign className="h-5 w-5" />} />
      <AdminMetricCard label="Active jobs" value={adminMetrics.activeJobs} icon={<Briefcase className="h-5 w-5" />} />
      <AdminMetricCard label="Workers" value={adminMetrics.workers.toLocaleString('en-US')} helper={`${adminMetrics.pendingWorkers} pending`} icon={<Users className="h-5 w-5" />} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_.75fr]">
      <Card className="p-5">
        <h2 className="text-section text-primary-800">Revenue vs payouts</h2>
        <div className="mt-5 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bridgr-neutral-200)" />
              <XAxis dataKey="month" stroke="var(--bridgr-neutral-600)" />
              <YAxis stroke="var(--bridgr-neutral-600)" tickFormatter={(value) => `$${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => usd(Number(value))} />
              <Area dataKey="revenue" name="Revenue" stroke="var(--bridgr-primary-600)" fill="var(--bridgr-primary-600)" fillOpacity={0.14} />
              <Area dataKey="payouts" name="Payouts" stroke="var(--bridgr-accent-500)" fill="var(--bridgr-accent-500)" fillOpacity={0.16} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-section text-primary-800">Pending queue</h2>
        <div className="mt-5 space-y-3">
          {pendingQueue.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-body font-semibold text-neutral-700">{label}</span>
              </div>
              <span className="font-mono text-lg font-bold text-primary-800">{value}</span>
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" variant="secondary" iconLeft={<ListChecks className="h-4 w-4" />}>Review queues</Button>
      </Card>
    </div>
  </div>
)
