import { Input } from '../../../design-system/components'
import type { OnboardingDraft, OnboardingErrors } from '../WorkerOnboardingPage'

interface StepProps {
  draft: OnboardingDraft
  errors: OnboardingErrors
  updateDraft: <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => void
}

export const CreateAccountStep = ({ draft, errors, updateDraft }: StepProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-page-title text-primary-800">Create your account</h1>
      <p className="mt-2 text-body text-neutral-600">Start with the basics. Your details stay inside Bridgr.</p>
    </div>
    <Input label="Full name" value={draft.fullName} error={errors.fullName} onChange={(event) => updateDraft('fullName', event.target.value)} />
    <Input label="Email" type="email" value={draft.email} error={errors.email} onChange={(event) => updateDraft('email', event.target.value)} />
    <Input label="Phone" type="tel" value={draft.phone} error={errors.phone} onChange={(event) => updateDraft('phone', event.target.value)} />
    <Input label="City" value={draft.city} error={errors.city} onChange={(event) => updateDraft('city', event.target.value)} />
    <Input label="Password" type="password" value={draft.password} error={errors.password} onChange={(event) => updateDraft('password', event.target.value)} />
    <Input label="Date of birth" type="date" value={draft.dateOfBirth} error={errors.dateOfBirth} onChange={(event) => updateDraft('dateOfBirth', event.target.value)} />
  </div>
)
