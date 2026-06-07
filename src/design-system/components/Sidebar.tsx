import { type ComponentType, type ReactNode } from 'react'
import { cn } from '../cn'
import { BrandLogo } from './BrandLogo'

export interface SidebarNavItem {
  label: string
  href?: string
  active?: boolean
  icon?: ComponentType<{ className?: string }>
  badge?: ReactNode
  onClick?: () => void
}

interface SidebarProps {
  items: SidebarNavItem[]
  footer?: ReactNode
  logo?: ReactNode
  className?: string
}

export const Sidebar = ({ items, footer, logo, className }: SidebarProps) => (
  <aside className={cn('flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-white', className)}>
    <div className="px-5 py-5">{logo ?? <BrandLogo size="md" />}</div>
    <nav className="flex-1 space-y-1 px-3">
      {items.map((item) => {
        const Icon = item.icon
        const content = (
          <>
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge}
          </>
        )
        const classNameForItem = cn(
          'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-body font-semibold transition-colors',
          item.active ? 'bg-primary-50 text-primary-800' : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-800'
        )

        return item.href ? (
          <a key={item.label} href={item.href} className={classNameForItem} onClick={item.onClick}>
            {content}
          </a>
        ) : (
          <button key={item.label} type="button" className={classNameForItem} onClick={item.onClick}>
            {content}
          </button>
        )
      })}
    </nav>
    {footer && <div className="border-t border-neutral-200 p-4">{footer}</div>}
  </aside>
)
