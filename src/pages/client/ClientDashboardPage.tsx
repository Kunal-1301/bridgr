import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CreditCard, Download, LifeBuoy, PlusCircle, Receipt, Timer, Wallet } from 'lucide-react'
import { clientKeys, getClientDashboard } from '../../api/clientPortal'
import { mockClientDashboard } from '../../features/client/mockClientData'
import { Button, Card, ProgressBar } from '../../design-system/components'
import { dateShort, usd } from './clientUtils'

const quickActions = [
  { label: 'Submit a new job', to: '/c/jobs/new', icon: PlusCircle },
  { label: 'Pay a milestone', to: '/c/payments', icon: CreditCard },
  { label: 'Download invoices', to: '/c/payments', icon: Download },
  { label: 'Contact your manager', to: '/c/support', icon: LifeBuoy },
]

export const ClientDashboardPage = () => {
  const dashboard = useQuery({ queryKey: clientKeys.dashboard(), queryFn: getClientDashboard })
  const data = dashboard.data || mockClientDashboard
  const stats = data.stats as typeof mockClientDashboard.stats
  const nextPayment = mockClientDashboard.nextPayment

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-page-title text-primary-800">Dashboard</h1>
          <p className="mt-1 text-body text-neutral-600">Welcome back, Maya</p>
        </div>
        <Link to="/c/jobs/new" className="inline-flex h-[42px] items-center justify-center gap-2 rounded-sm bg-primary-600 px-4 text-body font-semibold text-white shadow-sm transition hover:bg-primary-800">
          <PlusCircle className="h-4 w-4" />
          Submit a job
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Active projects" value={stats.activeProjects} icon={<Receipt className="h-5 w-5" />} />
        <Metric title="Total spend" value={usd(stats.totalSpent)} icon={<Wallet className="h-5 w-5" />} />
        <Metric title="Pending payments" value={usd(stats.pendingPayments)} icon={<CreditCard className="h-5 w-5" />} />
        <Metric title="Avg time to fill" value={`${stats.avgTimeToFill} days`} icon={<Timer className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.75fr]">
        <Card>
          <div className="border-b border-neutral-200 p-5">
            <h2 className="text-section text-primary-800">Active projects</h2>
            <p className="mt-1 text-body text-neutral-600">Project status and manager-visible progress.</p>
          </div>
          <div className="divide-y divide-neutral-200">
            {data.activeProjects.slice(0, 3).map((project) => (
              <Link key={project.id} to={`/c/jobs/${project.id}`} className="block p-5 transition hover:bg-neutral-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-subhead text-primary-800">{project.title}</h3>
                    <p className="mt-1 text-body text-neutral-600">{project.status}</p>
                  </div>
                  <span className="font-mono text-caption font-bold text-neutral-600">{project.progress}%</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={project.progress} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-section text-primary-800">Quick actions</h2>
            <div className="mt-4 grid gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} to={action.to} className="flex items-center gap-3 rounded-sm border border-neutral-200 bg-white px-4 py-3 text-body font-semibold text-primary-800 hover:bg-neutral-50">
                    <Icon className="h-4 w-4 text-primary-600" />
                    {action.label}
                  </Link>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-caption font-bold uppercase text-neutral-600">Next payment due</p>
            <h2 className="mt-3 text-section text-primary-800">{usd(nextPayment.amount)}</h2>
            <p className="mt-2 text-body text-neutral-600">{nextPayment.project}</p>
            <p className="mt-1 text-caption font-semibold text-warning">Due {dateShort(nextPayment.due)}</p>
            <Button className="mt-5 w-full" variant="amber">Pay milestone</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

const Metric = ({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-caption font-bold uppercase text-neutral-600">{title}</p>
        <p className="mt-3 font-mono text-[28px] font-bold leading-none text-primary-800">{value}</p>
      </div>
      <div className="rounded-md bg-primary-50 p-2 text-primary-600">{icon}</div>
    </div>
  </Card>
)
