import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, DollarSign, TrendingUp } from 'lucide-react'
import { AdminMetricCard } from '../../components/admin/AdminMetricCard'
import { Card } from '../../design-system/components'
import { analytics, revenueSeries } from '../../features/admin/mockAdminData'

const colors = ['var(--bridgr-primary-600)', 'var(--bridgr-accent-500)', 'var(--bridgr-success)', 'var(--bridgr-info)']
const usd = (value: number) => `$${value.toLocaleString('en-US')}`

export const AdminAnalyticsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-page-title text-primary-800">Analytics</h1>
      <p className="mt-1 text-body text-neutral-600">Revenue, forecast, worker pool, and automation performance.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label="Revenue MTD" value={usd(analytics.revenueMtd)} icon={<DollarSign className="h-5 w-5" />} />
      <AdminMetricCard label="Margin %" value={`${analytics.marginPercent}%`} icon={<TrendingUp className="h-5 w-5" />} />
      <AdminMetricCard label="Next month forecast" value={usd(analytics.nextMonthForecast)} />
      <AdminMetricCard label="Pipeline value" value={usd(analytics.pipelineValue)} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_.75fr]">
      <Card className="p-5">
        <h2 className="text-section text-primary-800">Revenue & forecast</h2>
        <div className="mt-5 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bridgr-neutral-200)" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => usd(Number(value))} />
              <Area dataKey="revenue" stroke="var(--bridgr-primary-600)" fill="var(--bridgr-primary-600)" fillOpacity={0.14} />
              <Area dataKey="forecast" stroke="var(--bridgr-accent-500)" fill="var(--bridgr-accent-500)" fillOpacity={0.14} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-section text-primary-800">Worker pool</h2>
        <div className="mt-5 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.workerPool} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96}>
                {analytics.workerPool.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card className="p-5">
        <h2 className="text-section text-primary-800">Top skills</h2>
        <div className="mt-5 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.topSkills} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="skill" width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--bridgr-primary-600)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <AdminMetricCard label="Automation hit rate" value={`${analytics.automationHitRate}%`} helper="Handled without admin this month" icon={<Activity className="h-5 w-5" />} />
    </div>
  </div>
)
