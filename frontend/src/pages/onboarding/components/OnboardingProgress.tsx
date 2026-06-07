interface OnboardingProgressProps {
  value: number
  total: number
}

export const OnboardingProgress = ({ value, total }: OnboardingProgressProps) => (
  <div className="space-y-2">
    <div className="flex justify-between text-caption font-semibold text-neutral-600">
      <span>{value} of {total}</span>
      <span>{Math.round((value / total) * 100)}%</span>
    </div>
    <div className="h-2 rounded-full bg-neutral-100">
      <div className="h-2 rounded-full bg-primary-600 transition-all" style={{ width: `${(value / total) * 100}%` }} />
    </div>
  </div>
)
