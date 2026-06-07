import { type HTMLAttributes } from 'react'
import { cn } from '../cn'

export const SkillTag = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-caption font-medium text-neutral-700 shadow-sm',
      className
    )}
    {...props}
  />
)
