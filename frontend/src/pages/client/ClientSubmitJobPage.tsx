import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import { submitClientJob } from '../../api/clientPortal'
import { Button, Card, Input, ProgressBar, Select, SkillTag, Textarea } from '../../design-system/components'
import { usd } from './clientUtils'

type Draft = {
  title: string
  description: string
  teamSize: number
  deadline: string
  skills: string[]
  scope: string
  budget: number
  paymentType: 'Fixed' | 'Milestone-based'
}

const minDeadline = format(addDays(new Date(), 7), 'yyyy-MM-dd')
const initialDraft: Draft = {
  title: '',
  description: '',
  teamSize: 1,
  deadline: minDeadline,
  skills: ['React', 'UI Design'],
  scope: '',
  budget: 3000,
  paymentType: 'Milestone-based',
}

const templates = ['Web Dev', 'Content', 'Design']
const steps = ['Basics', 'Skills & scope', 'Budget', 'Review']

export const ClientSubmitJobPage = () => {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [submitted, setSubmitted] = useState(false)
  const submit = useMutation({
    mutationFn: () => submitClientJob({
      title: draft.title || 'Untitled client job',
      description: draft.description || draft.scope || 'Client job submitted for Bridgr manager scoping.',
      skills: draft.skills,
      paymentType: draft.paymentType,
      fixedBudget: draft.budget,
      milestones: [{ title: 'Managed delivery milestone', amount: draft.budget, dueDate: draft.deadline }],
      teamSize: draft.teamSize,
      deadline: draft.deadline,
      deliverables: [draft.scope || 'Manager-scoped deliverables'],
    }),
    onSuccess: () => setSubmitted(true),
  })

  const progress = useMemo(() => (step / 4) * 100, [step])

  if (submitted) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-tint text-success">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-5 text-page-title text-primary-800">Job submitted</h1>
        <p className="mx-auto mt-3 max-w-lg text-body text-neutral-600">Your Bridgr manager will review the brief and follow up with next steps.</p>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-page-title text-primary-800">Submit a job</h1>
        <p className="mt-1 text-body text-neutral-600">Step {step} of 4: {steps[step - 1]}</p>
      </div>

      <Card className="p-5">
        <ProgressBar value={progress} />
      </Card>

      {step === 1 && (
        <Card className="p-6">
          <div className="rounded-lg border border-info/20 bg-info-tint px-4 py-3 text-body font-semibold text-info">
            Need help scoping? Start from a template - {templates.map((template) => (
              <button key={template} type="button" className="ml-1 underline" onClick={() => setDraft({ ...draft, scope: `${template} project scope` })}>{template}</button>
            ))}.
          </div>
          <div className="mt-6 grid gap-5">
            <Input label="Job title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <Textarea label="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Team size needed" type="number" min={1} value={draft.teamSize} onChange={(event) => setDraft({ ...draft, teamSize: Number(event.target.value) })} />
              <Input label="Deadline" type="date" min={minDeadline} value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-section text-primary-800">Skills & scope</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-caption font-bold uppercase text-primary-800">Required skills</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'UI Design', 'QA', 'Content'].map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setDraft({ ...draft, skills: draft.skills.includes(skill) ? draft.skills.filter((item) => item !== skill) : [...draft.skills, skill] })}
                  >
                    <SkillTag className={draft.skills.includes(skill) ? 'border-primary-600 bg-primary-50 text-primary-800' : ''}>{skill}</SkillTag>
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Scope notes" value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value })} />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6">
          <h2 className="text-section text-primary-800">Budget</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Select label="Payment type" value={draft.paymentType} onChange={(event) => setDraft({ ...draft, paymentType: event.target.value as Draft['paymentType'] })}>
              <option>Milestone-based</option>
              <option>Fixed</option>
            </Select>
            <Input label="Client budget" type="number" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: Number(event.target.value) })} />
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-6">
          <h2 className="text-section text-primary-800">Review</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Summary label="Title" value={draft.title} />
            <Summary label="Budget" value={usd(draft.budget)} />
            <Summary label="Team size" value={String(draft.teamSize)} />
            <Summary label="Deadline" value={draft.deadline} />
            <div className="md:col-span-2"><Summary label="Skills" value={draft.skills.join(', ')} /></div>
            <div className="md:col-span-2"><Summary label="Description" value={draft.description} /></div>
          </div>
        </Card>
      )}

      <div className="flex justify-between gap-3">
        <div className="flex gap-3">
          <Button variant="secondary" disabled={step === 1 || submit.isPending} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</Button>
          <Button variant="ghost" disabled={submit.isPending}>Save draft</Button>
        </div>
        {step < 4 ? (
          <Button onClick={() => setStep((current) => current + 1)}>Continue</Button>
        ) : (
          <Button loading={submit.isPending} onClick={() => submit.mutate()}>Submit for review</Button>
        )}
      </div>
    </div>
  )
}

const Summary = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg bg-neutral-50 p-4">
    <p className="text-caption font-bold uppercase text-neutral-600">{label}</p>
    <p className="mt-2 text-body font-semibold text-primary-800">{value || 'Not provided'}</p>
  </div>
)
