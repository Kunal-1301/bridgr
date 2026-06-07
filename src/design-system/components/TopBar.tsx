import { type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '../cn'
import { Button } from './Button'

interface TopBarProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  userSlot?: ReactNode
  onMenuClick?: () => void
  className?: string
}

export const TopBar = ({ title, subtitle, actions, userSlot, onMenuClick, className }: TopBarProps) => (
  <header className={cn('flex min-h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-5', className)}>
    <div className="flex min-w-0 items-center gap-3">
      {onMenuClick && (
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </Button>
      )}
      <div className="min-w-0">
        {title && <h1 className="truncate text-subhead text-primary-800">{title}</h1>}
        {subtitle && <p className="truncate text-caption text-neutral-600">{subtitle}</p>}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      {actions}
      {userSlot}
    </div>
  </header>
)
