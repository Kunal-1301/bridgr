import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Shield, Award, Star, Zap, UserCheck } from 'lucide-react'

export type TierVariant = 'newcomer' | 'verified' | 'certified' | 'pro' | 'elite'

interface TierBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier: TierVariant
  showIcon?: boolean
}

export const TierBadge = ({ tier, showIcon = true, className, ...props }: TierBadgeProps) => {
  const tierStyles: Record<TierVariant, { badge: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    newcomer: {
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: Shield,
      label: 'Newcomer',
    },
    verified: {
      badge: 'bg-blue-tint text-blue border-blue/20',
      icon: UserCheck,
      label: 'Verified',
    },
    certified: {
      badge: 'bg-success-tint text-success border-success/20',
      icon: Award,
      label: 'Certified',
    },
    pro: {
      badge: 'bg-amber-tint text-amber border-amber/20',
      icon: Star,
      label: 'Pro',
    },
    elite: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Zap,
      label: 'Elite',
    },
  }

  const currentTier = tierStyles[tier]
  const Icon = currentTier.icon

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-150',
          currentTier.badge,
          className
        )
      )}
      {...props}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{currentTier.label}</span>
    </span>
  )
}
