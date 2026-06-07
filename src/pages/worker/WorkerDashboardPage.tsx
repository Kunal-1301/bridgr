import { Link } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bell, Briefcase, CreditCard, Mail } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { TierBadge } from '../../components/ui/TierBadge'
import { LazyRender } from '../../components/ui/LazyRender'
import { Skeleton } from '../../components/ui/Skeleton'
import { useWorkerApplications, useWorkerDashboard, useWorkerProjects } from '../../hooks/api'
import { Card, Initials, LinkButton, PageSkeletonGrid, ProgressBar, SectionHeader, SkeletonBlock, WorkerPageTitle, dateShort, money, statusBadge } from './workerUtils'

export const WorkerDashboardPage = () => {
  const stats = useWorkerDashboard()
  const projects = useWorkerProjects({ limit: 3 })
  const applications = useWorkerApplications({ limit: 3, status: 'pending' })

  if (stats.isLoading) return <PageSkeletonGrid />
  const data = stats.data

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Worker Dashboard" subtitle="Your approved projects, earnings, applications, and workspace signals." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Projects" value={data?.activeProjects || 0} icon={Briefcase} trend={{ value: 'Active', isPositive: true }} />
        <StatCard title="Pending Earnings" value={money(data?.pendingEarnings || 0)} icon={CreditCard} description="Awaiting admin release" />
        <StatCard title="Unread Messages" value={data?.unreadMessages || 0} icon={Mail} description="Across active workspaces" />
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Tier Badge</span>
            <Bell className="h-4 w-4 text-blue" />
          </div>
          <div className="mt-5">
            <TierBadge tier={data?.tier || 'newcomer'} className="px-3 py-1.5 text-sm" />
          </div>
          <p className="mt-3 text-xs text-muted">Tier affects matching priority.</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionHeader title="Active Projects" action={<Link to="/w/projects" className="text-xs font-bold text-blue">View All</Link>} />
          <div className="space-y-4 p-5">
            {projects.isLoading ? <SkeletonBlock /> : projects.data?.map((project) => (
              <article key={project.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-navy">{project.title}</h3>
                    <p className="mt-1 text-xs text-muted">Masked client: CL-{project.id.slice(-2).toUpperCase()} · Team {project.team.length}</p>
                  </div>
                  <LinkButton to={`/w/projects/${project.id}`}>Open</LinkButton>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>Deadline {dateShort(project.deadline)}</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="mt-2"><ProgressBar value={project.progress} /></div>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Earnings Chart" />
          <LazyRender className="h-72 p-5" fallback={<Skeleton className="h-full w-full" />}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.earnings || []}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Line type="monotone" dataKey="amount" stroke="var(--bridgr-accent-500)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </LazyRender>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Recent Messages" />
          <div className="divide-y divide-border">
            {data?.messages.map((message) => (
              <div key={message.id} className="flex gap-3 p-5">
                <Initials value={message.senderInitials} />
                <div>
                  <p className="text-sm font-semibold text-navy">{message.preview}</p>
                  <p className="mt-1 text-xs text-muted">{dateShort(message.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Open Applications" />
          <div className="divide-y divide-border">
            {applications.isLoading ? <SkeletonBlock className="m-5 h-24" /> : applications.data?.map((application) => (
              <Link key={application.id} to="/w/applications" className="block p-5 transition hover:bg-surface">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-navy">{application.jobTitle}</p>
                  {statusBadge(application.status)}
                </div>
                <p className="mt-1 text-xs text-muted">Applied {dateShort(application.appliedDate)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
