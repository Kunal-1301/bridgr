import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Handshake, PlusCircle, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/toastStore'
import { adminKeys, getAdminJobInbox, updateInboxJobAction } from '../../api/admin'
import { Card, SectionHeader, SkeletonBlock, dateShort, usd } from './adminUtils'

export const AdminJobInboxPage = () => {
  const inbox = useQuery({ queryKey: adminKeys.inbox(), queryFn: getAdminJobInbox })
  const navigate = useNavigate()
  const { notify } = useToast()
  const action = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: string }) => updateInboxJobAction(id, mode),
    onSuccess: (_, variables) => notify({ kind: 'success', title: `Job marked ${variables.mode}` }),
  })

  if (inbox.isLoading) return <SkeletonBlock />

  return (
    <div className="space-y-6">
      <PageHeader title="Job Inbox" subtitle="Raw client submissions visible only to admin operators." />
      <div className="grid gap-5 xl:grid-cols-2">
        {inbox.data?.map((job) => (
          <Card key={job.id} className="overflow-hidden">
            <SectionHeader
              title={job.clientCompany}
              subtitle={`${job.clientContact || 'Client contact'} · submitted ${dateShort(job.submitted)}`}
              action={<span className="rounded-full bg-amber-tint px-3 py-1 text-sm font-bold text-amber">{usd(job.budget)}</span>}
            />
            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Original client title</p>
                <h2 className="mt-2 text-xl font-bold text-navy">{job.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{job.description}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Meta label="Team" value={String(job.teamSize || 1)} />
                <Meta label="Deadline" value={job.deadline ? dateShort(job.deadline) : 'TBD'} />
                <Meta label="Budget" value={usd(job.budget)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {job.skills?.map((skill) => <span key={skill} className="rounded-full bg-blue-tint px-3 py-1 text-xs font-bold text-blue">{skill}</span>)}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Deliverables</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {job.deliverables?.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <button onClick={() => navigate(`/admin/jobs/new?source=${job.id}`)} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">
                  <PlusCircle className="h-4 w-4" /> Create Listing
                </button>
                <button onClick={() => action.mutate({ id: job.id, mode: 'negotiate' })} className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-bold text-navy">
                  <Handshake className="h-4 w-4" /> Negotiate
                </button>
                <button onClick={() => action.mutate({ id: job.id, mode: 'reject' })} className="inline-flex items-center gap-2 rounded-md bg-error px-4 py-2.5 text-sm font-bold text-white">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Link to="/admin/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-blue"><CalendarDays className="h-4 w-4" /> View all worker-facing listings</Link>
    </div>
  )
}

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-surface p-4">
    <p className="text-xs font-bold uppercase text-muted">{label}</p>
    <p className="mt-2 font-bold text-navy">{value}</p>
  </div>
)
