import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { CalendarDays, CreditCard, MessageCircle } from 'lucide-react'
import { clientKeys, getClientJob, payMilestone } from '../../api/clientPortal'
import { Button, Card, StatusBadge, Timeline } from '../../design-system/components'
import { mockClientJobs } from '../../features/client/mockClientData'
import { dateShort, usd } from './clientUtils'

export const ClientJobStatusPage = () => {
  const { id = 'cj-dashboard' } = useParams()
  const jobQuery = useQuery({ queryKey: clientKeys.job(id), queryFn: () => getClientJob(id) })
  const payment = useMutation({ mutationFn: (milestoneId: string) => payMilestone(id, milestoneId) })
  const job = jobQuery.data || mockClientJobs.find((item) => item.id === id) || mockClientJobs[0]

  const timelineItems = [
    { title: 'Discovery & wireframes', description: 'Paid', status: 'complete' as const },
    { title: 'Component library', description: 'Paid', status: 'complete' as const },
    { title: 'Dashboard build', description: 'Pay $3,000', status: 'current' as const },
    { title: 'QA & handoff', description: 'Upcoming', status: 'upcoming' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-page-title text-primary-800">{job.title}</h1>
            <StatusBadge status="scheduled" label={job.status} />
          </div>
          <p className="mt-2 flex items-center gap-2 text-body text-neutral-600">
            <CalendarDays className="h-4 w-4" />
            Started {dateShort(job.submissionDate)}
          </p>
        </div>
        <Button iconLeft={<MessageCircle className="h-4 w-4" />}>Message manager</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="p-5">
          <h2 className="text-section text-primary-800">Milestone tracker</h2>
          <div className="mt-5">
            <Timeline items={timelineItems} />
          </div>
          <Button
            className="mt-4"
            variant="amber"
            loading={payment.isPending}
            onClick={() => payment.mutate(job.milestones.find((milestone) => milestone.status === 'Pending')?.id || job.milestones[0]?.id)}
            iconLeft={<CreditCard className="h-4 w-4" />}
          >
            Pay $3,000
          </Button>
        </Card>

        <Card className="p-5">
          <p className="text-caption font-bold uppercase text-neutral-600">Estimated completion</p>
          <h2 className="mt-3 text-section text-primary-800">Aug 30</h2>
          <p className="mt-3 text-body text-neutral-600">Your manager will confirm final delivery and handoff status.</p>
          <div className="mt-5 rounded-lg border border-info/20 bg-info-tint p-4 text-body font-semibold text-info">
            Client-side view only. Bridgr manages team assignment, delivery costs, and operations privately.
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-section text-primary-800">Updates from your manager</h2>
        </div>
        <div className="space-y-4 p-5">
          {job.updates.map((update) => (
            <div key={update.id} className="rounded-lg bg-neutral-50 p-4">
              <p className="text-caption font-bold uppercase text-primary-600">{update.type}</p>
              <p className="mt-2 text-body text-neutral-900">{update.message}</p>
              <p className="mt-2 text-caption text-neutral-600">{dateShort(update.timestamp)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-section text-primary-800">Project summary</h2>
        <p className="mt-3 text-body text-neutral-600">{job.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-caption font-semibold text-neutral-600">{skill}</span>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Summary label="Project amount" value={usd(job.budget)} />
          <Summary label="Progress" value={`${job.progress}%`} />
          <Summary label="Payment type" value={job.paymentType} />
        </div>
      </Card>
    </div>
  )
}

const Summary = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-neutral-50 p-4">
    <p className="text-caption font-bold uppercase text-neutral-600">{label}</p>
    <p className="mt-2 text-body font-semibold text-primary-800">{value}</p>
  </div>
)
