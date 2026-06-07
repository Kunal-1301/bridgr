import { type ComponentType, type ReactNode } from 'react'
import { cn } from '../cn'

export interface BottomTabItem {
  label: string
  active?: boolean
  icon?: ComponentType<{ className?: string }>
  onClick?: () => void
}

interface MobileShellProps {
  children: ReactNode
  header?: ReactNode
  bottomTabs?: BottomTabItem[]
  framed?: boolean
  className?: string
  contentClassName?: string
}

export const MobileShell = ({ children, header, bottomTabs, framed = false, className, contentClassName }: MobileShellProps) => (
  <div
    className={cn(
      'mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-white text-neutral-900',
      framed && 'min-h-[780px] rounded-2xl border border-white/40 shadow-phone',
      className
    )}
  >
    {header && <header className="shrink-0 border-b border-neutral-200 bg-white px-5 py-4">{header}</header>}
    <main className={cn('min-h-0 flex-1 overflow-y-auto bg-neutral-50 px-4 py-5', contentClassName)}>{children}</main>
    {bottomTabs && (
      <nav className="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(0,1fr))] border-t border-neutral-200 bg-white px-2 py-2">
        {bottomTabs.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-sm px-2 py-2 text-caption font-semibold transition-colors',
                item.active ? 'bg-primary-50 text-primary-800' : 'text-neutral-600 hover:bg-neutral-50'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="w-full truncate text-center">{item.label}</span>
            </button>
          )
        })}
      </nav>
    )}
  </div>
)
