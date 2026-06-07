import { LockKeyhole } from 'lucide-react'
import { FileUploadBox, Select } from '../../../design-system/components'
import type { OnboardingDraft, OnboardingErrors } from '../WorkerOnboardingPage'

interface StepProps {
  draft: OnboardingDraft
  errors: OnboardingErrors
  updateDraft: <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => void
}

export const IdentityStep = ({ draft, errors, updateDraft }: StepProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-page-title text-primary-800">Verify your identity</h1>
      <p className="mt-2 text-body text-neutral-600">This helps us keep the worker pool trusted and private.</p>
    </div>
    <Select label="ID type" value={draft.idType} error={errors.idType} onChange={(event) => updateDraft('idType', event.target.value)}>
      <option value="">Choose ID type</option>
      <option value="Aadhaar">Aadhaar</option>
      <option value="PAN">PAN</option>
      <option value="Passport">Passport</option>
      <option value="Driving License">Driving License</option>
    </Select>
    <FileUploadBox
      title={draft.idFront ? draft.idFront.name : 'Upload front'}
      description="Accepted: PDF, JPG, PNG. Max 10MB."
      actionLabel={draft.idFront ? 'Replace file' : 'Choose file'}
      accept=".pdf,.jpg,.jpeg,.png"
      error={errors.idFront}
      onChange={(event) => updateDraft('idFront', event.target.files?.[0] ?? null)}
    />
    <div className="flex gap-3 rounded-lg border border-primary-600/15 bg-primary-50 p-4 text-primary-800">
      <LockKeyhole className="h-5 w-5 shrink-0" />
      <p className="text-caption font-semibold">Encrypted and stored privately. Clients never see your ID.</p>
    </div>
  </div>
)
