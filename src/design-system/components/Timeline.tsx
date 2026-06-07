import { CheckCircle2, Circle, Clock3 } from 'lucide-react'
import { cn } from '../cn'

export interface TimelineItem {
  title: string
  description?: string
  timestamp?: string
  status?: 'complete' | 'current' | 'upcoming'
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const statusIcon = {
  complete: CheckCircle2,
  current: Clock3,
  upcoming: Circle,
}

export const Timeline = ({ items, className }: TimelineProps) => (
  <ol className={cn('space-y-0', className)}>
    {items.map((item, index) => {
      const status = item.status ?? 'upcoming'
      const Icon = statusIcon[status]
      const isLast = index === items.length - 1

      return (
        <li key={`${item.title}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {!isLast && <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-neutral-200" />}
          <span
            className={cn(
              'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white',
              status === 'complete' && 'border-success text-success',
              status === 'current' && 'border-primary-600 bg-primary-50 text-primary-600',
              status === 'upcoming' && 'border-neutral-200 text-neutral-600'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-body font-semibold text-neutral-900">{item.title}</h3>
              {item.timestamp && <span className="font-mono text-caption text-neutral-600">{item.timestamp}</span>}
            </div>
            {item.description && <p className="mt-1 text-body text-neutral-600">{item.description}</p>}
          </div>
        </li>
      )
    })}
  </ol>
)
