import { cn } from '../cn'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  className?: string
}

export const ProgressBar = ({ value, max = 100, label, showValue = false, className }: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-caption">
          {label && <span className="font-semibold text-primary-800">{label}</span>}
          {showValue && <span className="font-mono text-neutral-600">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
