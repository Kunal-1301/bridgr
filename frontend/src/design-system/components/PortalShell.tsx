import { type ReactNode } from 'react'
import { cn } from '../cn'
import { Sidebar, type SidebarNavItem } from './Sidebar'
import { TopBar } from './TopBar'

interface PortalShellProps {
  navItems: SidebarNavItem[]
  children: ReactNode
  title?: string
  subtitle?: string
  topActions?: ReactNode
  userSlot?: ReactNode
  sidebarFooter?: ReactNode
  className?: string
}

export const PortalShell = ({
  navItems,
  children,
  title,
  subtitle,
  topActions,
  userSlot,
  sidebarFooter,
  className,
}: PortalShellProps) => (
  <div className={cn('flex min-h-screen bg-neutral-50 text-neutral-900', className)}>
    <Sidebar items={navItems} footer={sidebarFooter} className="hidden lg:flex" />
    <div className="flex min-w-0 flex-1 flex-col">
      <TopBar title={title} subtitle={subtitle} actions={topActions} userSlot={userSlot} />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
    </div>
  </div>
)
