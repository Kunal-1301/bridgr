import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export const PageHeader = ({ title, subtitle, action, className, ...props }: PageHeaderProps) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5 mb-6',
          className
        )
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-bold text-navy tracking-tight leading-tight m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
