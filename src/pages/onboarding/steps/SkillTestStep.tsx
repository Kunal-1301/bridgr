import { Clock3, HelpCircle, Target } from 'lucide-react'
import { Button, Card, StatusBadge } from '../../../design-system/components'
import type { OnboardingDraft } from '../WorkerOnboardingPage'

interface StepProps {
  draft: OnboardingDraft
  updateDraft: <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => void
}

export const SkillTestStep = ({ draft, updateDraft }: StepProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-page-title text-primary-800">Take a skill test</h1>
      <p className="mt-2 text-body text-neutral-600">A short test can improve your matching priority.</p>
    </div>
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-subhead text-primary-800">React Fundamentals</h2>
          <p className="mt-1 text-body text-neutral-600">Recommended from your profile.</p>
        </div>
        <StatusBadge status={draft.skillTestStarted ? 'scheduled' : 'draft'} label={draft.skillTestStarted ? 'Started' : 'Optional'} />
      </div>
      <div className="mt-5 grid gap-3 text-body text-neutral-600">
        <p className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary-600" /> 20 questions</p>
        <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary-600" /> 30 min</p>
        <p className="flex items-center gap-2"><Target className="h-4 w-4 text-primary-600" /> 70% pass</p>
      </div>
      <Button className="mt-5 w-full" onClick={() => updateDraft('skillTestStarted', true)}>
        Start test
      </Button>
    </Card>
    <button type="button" className="w-full text-center text-body font-bold text-primary-600" onClick={() => updateDraft('skillTestStarted', false)}>
      Skip for now
    </button>
  </div>
)
