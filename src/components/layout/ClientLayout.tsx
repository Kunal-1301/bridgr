import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, Briefcase, CreditCard, HelpCircle, LayoutDashboard, LogOut, PlusCircle, Search, User } from 'lucide-react'
import { BrandLogo } from '../../design-system/components'
import { cn } from '../../design-system/cn'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { name: 'Dashboard', path: '/c/dashboard', icon: LayoutDashboard },
  { name: 'Submit a Job', path: '/c/jobs/new', icon: PlusCircle },
  { name: 'My Jobs', path: '/c/jobs', icon: Briefcase },
  { name: 'Payments', path: '/c/payments', icon: CreditCard },
  { name: 'Profile', path: '/c/profile', icon: User },
  { name: 'Support', path: '/c/support', icon: HelpCircle },
]

export const ClientLayout = () => {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/client/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      <aside className="hidden w-72 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-[72px] items-center border-b border-neutral-200 px-6">
          <BrandLogo />
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/c/dashboard' || item.path === '/c/jobs'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-sm px-3 py-2.5 text-body font-semibold transition-colors',
                    isActive ? 'bg-primary-50 text-primary-800' : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-800'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-body font-bold text-white">MC</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-bold text-primary-800">Maya Chen</p>
              <p className="truncate text-caption text-neutral-600">Northwind Co.</p>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-sm p-2 text-neutral-600 hover:bg-white hover:text-error" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-5 lg:px-8">
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              aria-label="Search client portal"
              placeholder="Search projects, invoices, updates"
              className="h-[42px] w-full rounded-sm border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-body outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
          <BrandLogo className="lg:hidden" />
          <div className="flex items-center gap-3">
            <button className="relative rounded-sm border border-neutral-200 bg-white p-2.5 text-neutral-600 hover:text-primary-800" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-white" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-body font-bold text-white">MC</div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto bg-neutral-50 p-5 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
