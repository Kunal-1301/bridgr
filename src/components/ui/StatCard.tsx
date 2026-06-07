import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  trend?: {
    value: string | number
    isPositive: boolean
  }
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

export const StatCard = ({
  title,
  value,
  trend,
  icon: Icon,
  description,
  className,
  ...props
}: StatCardProps) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-lg border border-border p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
          className
        )
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 bg-blue-tint rounded-md text-blue">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="text-3xl font-extrabold text-navy tracking-tight">{value}</span>
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border',
              trend.isPositive
                ? 'bg-success/5 text-success border-success/10'
                : 'bg-error-tint text-error border-error/10'
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-muted leading-none">{description}</p>
      )}
    </div>
  )
}
