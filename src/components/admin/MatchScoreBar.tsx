import * as Tooltip from '@radix-ui/react-tooltip'

interface MatchScoreBarProps {
  score: number
  breakdown?: {
    skill?: string
    cert?: string
    trust?: string
    availability?: string
  }
}

const scoreMeta = (score: number) => {
  if (score >= 80) return { label: 'Strong Match', bar: 'bg-success', text: 'text-success' }
  if (score >= 60) return { label: 'Good Match', bar: 'bg-amber', text: 'text-amber' }
  if (score >= 40) return { label: 'Partial Match', bar: 'bg-blue', text: 'text-blue' }
  return { label: 'Low Match', bar: 'bg-slate-400', text: 'text-muted' }
}

export const MatchScoreBar = ({ score, breakdown }: MatchScoreBarProps) => {
  const meta = scoreMeta(score)
  const tip = breakdown
    ? `Skill Match: ${breakdown.skill || '35/35'} | Cert: ${breakdown.cert || '15/20'} | Trust: ${breakdown.trust || '18/20'} | Availability: ${breakdown.availability || '5/5'}`
    : 'Skill Match: 35/35 | Cert: 15/20 | Trust: 18/20 | Availability: 5/5'

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="min-w-44">
            <div className="flex items-center justify-between gap-3 text-xs font-bold">
              <span className={meta.text}>{meta.label}</span>
              <span className="text-navy">{score}/100</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface">
              <div className={`h-2 rounded-full ${meta.bar}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={6} className="z-50 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white shadow-lg">
            {tip}
            <Tooltip.Arrow className="fill-navy" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
