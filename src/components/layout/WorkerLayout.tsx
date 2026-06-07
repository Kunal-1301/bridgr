import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  FileText,
  FolderKanban,
  CheckSquare,
  CreditCard,
  User,
  Gift,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export const WorkerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, clearAuth } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  // Worker Navigation Items
  const navItems = [
    { name: 'Dashboard', path: '/w/dashboard', icon: LayoutDashboard },
    { name: 'Browse Jobs', path: '/w/jobs', icon: Search },
    { name: 'Applications', path: '/w/applications', icon: FileText },
    { name: 'Projects', path: '/w/projects', icon: FolderKanban },
    { name: 'Tests', path: '/w/tests', icon: CheckSquare },
    { name: 'Payments', path: '/w/payments', icon: CreditCard },
    { name: 'Profile', path: '/w/profile', icon: User },
    { name: 'Referral', path: '/w/referral', icon: Gift },
  ]
  const bottomNavItems = navItems.slice(0, 4)

  // Generate breadcrumbs from URL path
  const pathnames = location.pathname.split('/').filter((x) => x)
  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`
    const isLast = index === pathnames.length - 1
    const displayName = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')

    return { to, displayName, isLast }
  })

  const logo = (
    <div className="flex items-center gap-3">
      <svg className="w-8 h-8 text-white flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="22" r="4" fill="currentColor" />
        <circle cx="24" cy="10" r="4" fill="currentColor" />
        <path d="M8 22C12 22 16 10 24 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 22C8 14 16 10 24 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" className="opacity-50" />
      </svg>
      <span className="font-sans font-bold text-lg tracking-tight text-white">Bridgr</span>
    </div>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full bg-primary-800 text-white">
      {/* Logo Header */}
      <div className="flex items-center h-16 px-6 border-b border-navy-800/20 bg-navy/95">
        {logo}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/w/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold uppercase text-white shadow-inner">
          {user?.fullName?.charAt(0) || user?.email.charAt(0) || 'W'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-none mb-0.5">{user?.fullName || 'Worker User'}</p>
          <p className="text-[10px] text-slate-300 truncate leading-none">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-300 hover:text-red-400 p-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-60 flex-shrink-0 h-full border-r border-border shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer menu */}
          <div className="relative flex flex-col w-full max-w-xs bg-navy text-white animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-full">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-border shadow-sm">
          {/* Mobile menu trigger + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted">
              <Link to="/w/dashboard" className="hover:text-blue-600 transition-colors">Worker Portal</Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.to}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  {crumb.isLast ? (
                    <span className="text-navy font-semibold">{crumb.displayName}</span>
                  ) : (
                    <Link to={crumb.to} className="hover:text-blue-600 transition-colors">
                      {crumb.displayName}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Controls right */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* User Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 outline-none">
                  <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold border-2 border-border shadow-sm uppercase cursor-pointer hover:border-blue-600 transition-colors">
                    {user?.fullName?.charAt(0) || user?.email.charAt(0) || 'W'}
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[200px] bg-white rounded-lg p-1.5 shadow-lg border border-border animate-in fade-in slide-in-from-top-2 duration-150 z-50"
                  sideOffset={6}
                  align="end"
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-semibold text-navy leading-none mb-1">{user?.fullName || 'Worker User'}</p>
                    <p className="text-xs text-muted truncate leading-none">{user?.email}</p>
                  </div>

                  <DropdownMenu.Item
                    onClick={() => navigate('/w/profile')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-md outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onClick={() => navigate('/w/settings')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-md outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md outline-none cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Content Pane scrollable */}
        <main className="flex-1 overflow-y-auto bg-surface p-6 pb-24 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-white shadow-lg md:hidden">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/w/dashboard'}
                className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-bold ${isActive ? 'text-blue' : 'text-muted'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.name === 'Browse Jobs' ? 'Jobs' : item.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
