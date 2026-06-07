import { ShieldCheck } from 'lucide-react'
import { FileUploadBox } from '../../../design-system/components'
import type { OnboardingDraft, OnboardingErrors } from '../WorkerOnboardingPage'

interface StepProps {
  draft: OnboardingDraft
  errors: OnboardingErrors
  updateDraft: <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => void
}

export const ResumeStep = ({ draft, errors, updateDraft }: StepProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-page-title text-primary-800">Upload your resume</h1>
      <p className="mt-2 text-body text-neutral-600">PDF or DOCX, up to 10MB. This is not sent to clients.</p>
    </div>
    <FileUploadBox
      title={draft.resume ? draft.resume.name : 'Add resume'}
      description="Accepted: PDF, DOC, DOCX. Max 10MB."
      actionLabel={draft.resume ? 'Replace file' : 'Choose file'}
      accept=".pdf,.doc,.docx"
      error={errors.resume}
      onChange={(event) => updateDraft('resume', event.target.files?.[0] ?? null)}
    />
    <div className="flex gap-3 rounded-lg border border-success/20 bg-success-tint p-4 text-success">
      <ShieldCheck className="h-5 w-5 shrink-0" />
      <p className="text-caption font-semibold">Stored securely and reviewed only by Bridgr operators.</p>
    </div>
  </div>
)
