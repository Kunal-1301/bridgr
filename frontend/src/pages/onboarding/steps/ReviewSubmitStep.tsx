import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Card } from '../../../design-system/components'
import { cn } from '../../../design-system/cn'
import type { OnboardingDraft, OnboardingErrors } from '../WorkerOnboardingPage'

interface ReviewSubmitStepProps {
  draft: OnboardingDraft
  completed: Record<string, boolean>
  errors: OnboardingErrors
  goToStep: (step: number) => void
}

const rows = [
  { label: 'Account details', key: 'account', step: 0 },
  { label: 'Skills & profile', key: 'profile', step: 1 },
  { label: 'Resume', key: 'resume', step: 2 },
  { label: 'Portfolio', key: 'portfolio', step: 3 },
  { label: 'ID proof', key: 'identity', step: 4 },
  { label: 'Skill test', key: 'test', step: 5 },
] as const

export const ReviewSubmitStep = ({ draft, completed, errors, goToStep }: ReviewSubmitStepProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-page-title text-primary-800">Review & submit</h1>
      <p className="mt-2 text-body text-neutral-600">Make sure everything looks right before Bridgr reviews it.</p>
    </div>
    <Card className="divide-y divide-neutral-200">
      {rows.map((row) => {
        const isDone = completed[row.key]
        return (
          <div key={row.key} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              {isDone ? <CheckCircle2 className="h-5 w-5 text-success" /> : <CircleAlert className="h-5 w-5 text-warning" />}
              <span className={cn('text-body font-semibold', isDone ? 'text-neutral-900' : 'text-neutral-600')}>{row.label}</span>
            </div>
            <button type="button" className="text-caption font-bold text-primary-600" onClick={() => goToStep(row.step)}>
              Edit
            </button>
          </div>
        )
      })}
    </Card>
    <Card className="p-4">
      <p className="text-caption font-bold uppercase text-primary-800">Application summary</p>
      <div className="mt-3 space-y-2 text-body text-neutral-600">
        <p><strong className="text-neutral-900">Name:</strong> {draft.fullName}</p>
        <p><strong className="text-neutral-900">City:</strong> {draft.city}</p>
        <p><strong className="text-neutral-900">Skills:</strong> {draft.skills.join(', ')}</p>
        <p><strong className="text-neutral-900">Rate:</strong> Rs {draft.rateMin} - Rs {draft.rateMax}/hr</p>
      </div>
    </Card>
    {errors.submit && <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">{errors.submit}</p>}
    <p className="text-caption text-neutral-600">By submitting, you confirm this information is accurate and belongs to you.</p>
  </div>
)
