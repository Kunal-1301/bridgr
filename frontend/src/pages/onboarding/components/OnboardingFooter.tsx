import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '../../../design-system/components'

interface OnboardingFooterProps {
  canGoBack: boolean
  primaryLabel: string
  loading?: boolean
  onBack: () => void
  onNext: () => void
}

export const OnboardingFooter = ({ canGoBack, primaryLabel, loading, onBack, onNext }: OnboardingFooterProps) => (
  <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-neutral-200 bg-white px-4 py-4">
    <Button variant="secondary" size="md" disabled={!canGoBack || loading} onClick={onBack} iconLeft={<ArrowLeft className="h-4 w-4" />}>
      Back
    </Button>
    <Button size="md" loading={loading} onClick={onNext} iconRight={<ArrowRight className="h-4 w-4" />}>
      {primaryLabel}
    </Button>
  </div>
)
