import { Award, Shield, Sparkles, Star, UserCheck } from 'lucide-react'
import { cn } from '../cn'

export type WorkerTier = 'newcomer' | 'verified' | 'certified' | 'pro' | 'elite'

interface TierBadgeProps {
  tier: WorkerTier
  showIcon?: boolean
  className?: string
}

const tierConfig: Record<WorkerTier, { label: string; className: string; icon: typeof Shield }> = {
  newcomer: {
    label: 'Newcomer',
    className: 'border-neutral-200 bg-neutral-50 text-neutral-600',
    icon: Shield,
  },
  verified: {
    label: 'Verified',
    className: 'border-primary-600/20 bg-primary-50 text-primary-600',
    icon: UserCheck,
  },
  certified: {
    label: 'Certified',
    className: 'border-success/20 bg-success-tint text-success',
    icon: Award,
  },
  pro: {
    label: 'Pro',
    className: 'border-accent-500/25 bg-accent-50 text-primary-800',
    icon: Star,
  },
  elite: {
    label: 'Elite',
    className: 'border-primary-400/30 bg-primary-800 text-white',
    icon: Sparkles,
  },
}

export const TierBadge = ({ tier, showIcon = true, className }: TierBadgeProps) => {
  const config = tierConfig[tier]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-caption font-semibold leading-5',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  )
}
