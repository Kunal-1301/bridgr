import { type ComponentType, type HTMLAttributes } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../cn'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  icon?: ComponentType<{ className?: string }>
  helperText?: string
  trend?: {
    value: string | number
    direction: 'up' | 'down'
  }
}

export const StatCard = ({ label, value, icon: Icon, helperText, trend, className, ...props }: StatCardProps) => (
  <div className={cn('rounded-lg border border-neutral-200 bg-white p-5 shadow-sm', className)} {...props}>
    <div className="flex items-start justify-between gap-4">
      <span className="text-caption font-bold uppercase text-primary-800">{label}</span>
      {Icon && (
        <span className="rounded-md bg-primary-50 p-2 text-primary-600">
          <Icon className="h-4 w-4" />
        </span>
      )}
    </div>
    <div className="mt-4 flex items-end gap-2">
      <span className="font-mono text-[30px] font-bold leading-none text-neutral-900">{value}</span>
      {trend && (
        <span
          className={cn(
            'mb-1 inline-flex items-center rounded-sm border px-1.5 py-0.5 text-caption font-semibold',
            trend.direction === 'up'
              ? 'border-success/20 bg-success-tint text-success'
              : 'border-error/20 bg-error-tint text-error'
          )}
        >
          {trend.direction === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend.value}
        </span>
      )}
    </div>
    {helperText && <p className="mt-2 text-caption text-neutral-600">{helperText}</p>}
  </div>
)
