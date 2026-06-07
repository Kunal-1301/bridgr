import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { getApplications, type Application, type ApplicationStatus, workerKeys } from '../../api/worker'
import { Card, SkeletonBlock, WorkerPageTitle, dateShort, statusBadge } from './workerUtils'

const columns: { title: ApplicationStatus; tone: string }[] = [
  { title: 'Applied', tone: 'bg-slate-100 text-muted' },
  { title: 'Shortlisted', tone: 'bg-blue-tint text-blue' },
  { title: 'Interview Scheduled', tone: 'bg-amber-tint text-amber' },
  { title: 'Selected', tone: 'bg-success-tint text-success' },
  { title: 'Rejected', tone: 'bg-error-tint text-error' },
]

export const WorkerApplicationsPage = () => {
  const [selected, setSelected] = useState<Application | null>(null)
  const applications = useQuery({ queryKey: workerKeys.applications(), queryFn: () => getApplications() })

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="My Applications" subtitle="Track every worker-side application through admin review." />
      {applications.isLoading ? <SkeletonBlock className="h-80" /> : (
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map((column) => (
            <Card key={column.title} className="min-h-72">
              <div className={`rounded-t-lg px-4 py-3 text-sm font-bold ${column.tone}`}>{column.title}</div>
              <div className="space-y-3 p-3">
                {applications.data?.filter((app) => app.status === column.title).map((application) => (
                  <button key={application.id} onClick={() => setSelected(application)} className="w-full rounded-lg border border-border bg-white p-4 text-left shadow-sm transition hover:border-blue">
                    <h3 className="text-sm font-bold text-navy">{application.jobTitle}</h3>
                    <p className="mt-2 text-xs text-muted">{application.note}</p>
                    <p className="mt-3 text-xs font-semibold text-muted">Applied {dateShort(application.appliedDate)}</p>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog.Root open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
          <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-white p-6 shadow-lg">
            {selected ? (
              <>
                <Dialog.Title className="text-xl font-bold text-navy">{selected.jobTitle}</Dialog.Title>
                <div className="mt-3">{statusBadge(selected.status)}</div>
                <section className="mt-6">
                  <h3 className="text-sm font-bold text-navy">Job Summary</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{selected.jobSummary}</p>
                </section>
                <section className="mt-6">
                  <h3 className="text-sm font-bold text-navy">Cover Note</h3>
                  <p className="mt-2 rounded-md bg-surface p-4 text-sm leading-6 text-muted">{selected.coverNote}</p>
                </section>
                {selected.adminNotes ? (
                  <section className="mt-6">
                    <h3 className="text-sm font-bold text-navy">Shared Admin Notes</h3>
                    <p className="mt-2 rounded-md bg-blue-tint p-4 text-sm leading-6 text-blue">{selected.adminNotes}</p>
                  </section>
                ) : null}
                <section className="mt-6">
                  <h3 className="text-sm font-bold text-navy">Status History</h3>
                  <ol className="mt-3 space-y-3">
                    {selected.history.map((item) => (
                      <li key={`${item.status}-${item.date}`} className="flex gap-3 text-sm">
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue" />
                        <span><strong className="text-navy">{item.status}</strong> · {dateShort(item.date)}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
