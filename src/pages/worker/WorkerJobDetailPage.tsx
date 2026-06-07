import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { applyToJob, getJob, jobKeys } from '../../api/jobs'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, SkeletonBlock, WorkerPageTitle, dateShort, money, relativeDate } from './workerUtils'

const schema = z.object({ coverNote: z.string().min(50, 'Write at least 50 characters').max(500, 'Keep it under 500 characters') })
type ApplyForm = z.infer<typeof schema>

export const WorkerJobDetailPage = () => {
  const { id = '' } = useParams()
  const [open, setOpen] = useState(false)
  const { notify } = useToast()
  const job = useQuery({ queryKey: jobKeys.detail(id), queryFn: () => getJob(id) })
  const form = useForm<ApplyForm>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (values: ApplyForm) => applyToJob(id, values.coverNote),
    onSuccess: () => {
      notify({ kind: 'success', title: 'Application submitted', message: 'Admin will review your fit for this worker scope.' })
      setOpen(false)
    },
    onError: () => notify({ kind: 'error', title: 'Could not apply', message: 'Please try again in a moment.' }),
  })

  if (job.isLoading) return <SkeletonBlock className="h-[520px]" />
  if (!job.data) return null

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <WorkerPageTitle title={job.data.title} subtitle="Worker-facing job scope. Client identifiers are intentionally omitted." />
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            {job.data.skills.map((skill) => <span key={skill} className="rounded-full bg-amber-tint px-3 py-1 text-xs font-bold text-amber">{skill}</span>)}
            <Badge variant="info">{job.data.paymentType}</Badge>
            <Badge variant="active">{job.data.visibility}</Badge>
          </div>
          <div className="prose prose-sm mt-6 max-w-none text-muted">
            <p>{job.data.description}</p>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Deliverables" />
          <ul className="space-y-3 p-6">
            {job.data.deliverables.map((deliverable) => <li key={deliverable} className="rounded-md bg-surface px-4 py-3 text-sm font-medium text-ink">{deliverable}</li>)}
          </ul>
        </Card>
        <Card className="grid gap-4 p-6 text-sm md:grid-cols-3">
          <div><p className="text-xs text-muted">Team size</p><p className="font-bold text-navy">{job.data.teamSize}</p></div>
          <div><p className="text-xs text-muted">Deadline</p><p className="font-bold text-navy">{dateShort(job.data.deadline)} ({relativeDate(job.data.deadline)})</p></div>
          <div><p className="text-xs text-muted">Duration estimate</p><p className="font-bold text-navy">{job.data.duration}</p></div>
        </Card>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <Card className="p-6">
          <p className="text-xs font-bold uppercase text-muted">Worker Budget</p>
          <p className="mt-2 text-4xl font-bold text-navy">{money(job.data.budget)}</p>
          <p className="mt-2 text-sm text-muted">{job.data.paymentType} payout structure</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-surface p-3"><p className="text-xs text-muted">Applications</p><p className="font-bold text-navy">{job.data.applicationsReceived}</p></div>
            <div className="rounded-md bg-surface p-3"><p className="text-xs text-muted">Team needed</p><p className="font-bold text-navy">{job.data.teamSize}</p></div>
          </div>
          {job.data.alreadyApplied ? <Badge variant="approved" className="mt-6">You've applied</Badge> : <button onClick={() => setOpen(true)} className="mt-6 w-full rounded-md bg-blue px-4 py-3 text-sm font-bold text-white">Apply Now</button>}
        </Card>
      </aside>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-bold text-navy">Apply to job</Dialog.Title>
            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase text-navy">Why are you a good fit?</span>
                <textarea {...form.register('coverNote')} className="mt-2 min-h-36 w-full rounded-md border border-border p-3 text-sm outline-none focus:border-blue" />
                {form.formState.errors.coverNote ? <p className="mt-1 text-xs text-error">{form.formState.errors.coverNote.message}</p> : null}
              </label>
              <button disabled={mutation.isPending} className="w-full rounded-md bg-blue px-4 py-3 text-sm font-bold text-white disabled:opacity-60">Confirm Application</button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
