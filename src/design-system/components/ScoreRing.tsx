import { cn } from '../cn'

interface ScoreRingProps {
  value: number
  max?: number
  label?: string
  size?: number
  className?: string
}

export const ScoreRing = ({ value, max = 100, label, size = 96, className }: ScoreRingProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)} style={{ width: size }}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} aria-label={`${Math.round(percentage)} percent`}>
        <circle cx="50" cy="50" r={radius} className="stroke-neutral-100" strokeWidth="10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-primary-600"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="54" textAnchor="middle" className="fill-primary-800 font-mono text-[20px] font-bold">
          {Math.round(percentage)}
        </text>
      </svg>
      {label && <span className="text-center text-caption font-semibold text-neutral-600">{label}</span>}
    </div>
  )
}
