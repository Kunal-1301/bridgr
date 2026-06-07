import { AlertTriangle } from 'lucide-react'
import { Button, Timeline } from '../../../design-system/components'

interface PendingVerificationStepProps {
  onEdit: () => void
  onApprovedPreview: () => void
}

export const PendingVerificationStep = ({ onEdit, onApprovedPreview }: PendingVerificationStepProps) => (
  <div className="flex min-h-[560px] flex-col justify-between">
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning-tint text-warning">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-page-title text-primary-800">Profile under review</h1>
        <p className="mt-2 text-body text-neutral-600">Your application is with Bridgr operators. We will notify you after review.</p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-5 text-left shadow-sm">
        <Timeline
          items={[
            { title: 'Submitted', description: 'Application received.', status: 'complete' },
            { title: 'Under review', description: 'Identity, skills, and fit are being checked.', status: 'current' },
            { title: 'Decision', description: 'You will see approved status or requested edits.', status: 'upcoming' },
          ]}
        />
      </div>
    </div>
    <div className="space-y-3">
      <Button className="w-full" variant="secondary" onClick={onEdit}>Edit my profile</Button>
      <Button className="w-full" variant="ghost" onClick={onApprovedPreview}>Preview approved screen</Button>
    </div>
  </div>
)
