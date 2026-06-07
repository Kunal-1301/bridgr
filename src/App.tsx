import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { AdminLayout } from './components/layout/AdminLayout'
import { ClientLayout } from './components/layout/ClientLayout'
import { WorkerLayout } from './components/layout/WorkerLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AdminRoute, ClientRoute, WorkerRoute } from './components/ProtectedRoute'
import { RouteLoader } from './components/ui/RouteLoader'
import { ToastProvider } from './components/ui/toastStore'
import { apiStaleTimes } from './api/client'

const lazyNamed = <T extends Record<K, ComponentType>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K
) => lazy(async () => ({ default: (await loader())[exportName] }))

const LandingPage = lazyNamed(() => import('./pages/public/LandingPage'), 'LandingPage')
const WorkerLoginPage = lazyNamed(() => import('./pages/public/WorkerLoginPage'), 'WorkerLoginPage')
const ClientLoginPage = lazyNamed(() => import('./pages/public/ClientLoginPage'), 'ClientLoginPage')
const AdminLoginPage = lazyNamed(() => import('./pages/public/AdminLoginPage'), 'AdminLoginPage')
const WorkerOnboardingPage = lazyNamed(() => import('./pages/onboarding/WorkerOnboardingPage'), 'WorkerOnboardingPage')
const ForgotPasswordPage = lazyNamed(() => import('./pages/public/ForgotPasswordPage'), 'ForgotPasswordPage')
const EmailVerifyPage = lazyNamed(() => import('./pages/public/EmailVerifyPage'), 'EmailVerifyPage')
const AffiliateSignupPage = lazyNamed(() => import('./pages/public/AffiliateSignupPage'), 'AffiliateSignupPage')
const NotFoundPage = lazyNamed(() => import('./pages/public/NotFoundPage'), 'NotFoundPage')

const WorkerDashboardPage = lazyNamed(() => import('./pages/worker/WorkerDashboardPage'), 'WorkerDashboardPage')
const WorkerJobsPage = lazyNamed(() => import('./pages/worker/WorkerJobsPage'), 'WorkerJobsPage')
const WorkerJobDetailPage = lazyNamed(() => import('./pages/worker/WorkerJobDetailPage'), 'WorkerJobDetailPage')
const WorkerApplicationsPage = lazyNamed(() => import('./pages/worker/WorkerApplicationsPage'), 'WorkerApplicationsPage')
const WorkerProjectsPage = lazyNamed(() => import('./pages/worker/WorkerProjectsPage'), 'WorkerProjectsPage')
const WorkerProjectWorkspacePage = lazyNamed(() => import('./pages/worker/WorkerProjectWorkspacePage'), 'WorkerProjectWorkspacePage')
const WorkerTestsPage = lazyNamed(() => import('./pages/worker/WorkerTestsPage'), 'WorkerTestsPage')
const WorkerPaymentsPage = lazyNamed(() => import('./pages/worker/WorkerPaymentsPage'), 'WorkerPaymentsPage')
const WorkerProfilePage = lazyNamed(() => import('./pages/worker/WorkerProfilePage'), 'WorkerProfilePage')
const WorkerReferralPage = lazyNamed(() => import('./pages/worker/WorkerReferralPage'), 'WorkerReferralPage')
const WorkerNotificationsPage = lazyNamed(() => import('./pages/worker/WorkerNotificationsPage'), 'WorkerNotificationsPage')
const WorkerSettingsPage = lazyNamed(() => import('./pages/worker/WorkerSettingsPage'), 'WorkerSettingsPage')

const ClientDashboardPage = lazyNamed(() => import('./pages/client/ClientDashboardPage'), 'ClientDashboardPage')
const ClientSubmitJobPage = lazyNamed(() => import('./pages/client/ClientSubmitJobPage'), 'ClientSubmitJobPage')
const ClientJobsPage = lazyNamed(() => import('./pages/client/ClientJobsPage'), 'ClientJobsPage')
const ClientJobStatusPage = lazyNamed(() => import('./pages/client/ClientJobStatusPage'), 'ClientJobStatusPage')
const ClientPaymentsPage = lazyNamed(() => import('./pages/client/ClientPaymentsPage'), 'ClientPaymentsPage')
const ClientProfilePage = lazyNamed(() => import('./pages/client/ClientProfilePage'), 'ClientProfilePage')
const ClientSupportPage = lazyNamed(() => import('./pages/client/ClientSupportPage'), 'ClientSupportPage')

const AdminDashboardPage = lazyNamed(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage')
const AdminWorkersPage = lazyNamed(() => import('./pages/admin/AdminWorkersPage'), 'AdminWorkersPage')
const AdminWorkerDetailPage = lazyNamed(() => import('./pages/admin/AdminWorkerDetailPage'), 'AdminWorkerDetailPage')
const AdminVerificationQueuePage = lazyNamed(() => import('./pages/admin/AdminVerificationQueuePage'), 'AdminVerificationQueuePage')
const AdminClientsPage = lazyNamed(() => import('./pages/admin/AdminClientsPage'), 'AdminClientsPage')
const AdminJobInboxPage = lazyNamed(() => import('./pages/admin/AdminJobInboxPage'), 'AdminJobInboxPage')
const AdminListingsPage = lazyNamed(() => import('./pages/admin/AdminListingsPage'), 'AdminListingsPage')
const AdminCreateListingPage = lazyNamed(() => import('./pages/admin/AdminCreateListingPage'), 'AdminCreateListingPage')
const AdminProjectsPage = lazyNamed(() => import('./pages/admin/AdminProjectsPage'), 'AdminProjectsPage')
const AdminProjectWorkspacePage = lazyNamed(() => import('./pages/admin/AdminProjectWorkspacePage'), 'AdminProjectWorkspacePage')
const AdminPaymentsPage = lazyNamed(() => import('./pages/admin/AdminPaymentsPage'), 'AdminPaymentsPage')
const AdminMarginReportPage = lazyNamed(() => import('./pages/admin/AdminMarginReportPage'), 'AdminMarginReportPage')
const AdminAnalyticsPage = lazyNamed(() => import('./pages/admin/AdminAnalyticsPage'), 'AdminAnalyticsPage')
const AdminReferralsPage = lazyNamed(() => import('./pages/admin/AdminReferralsPage'), 'AdminReferralsPage')
const AdminTestsPage = lazyNamed(() => import('./pages/admin/AdminTestsPage'), 'AdminTestsPage')
const AdminAutomationsPage = lazyNamed(() => import('./pages/admin/AdminAutomationsPage'), 'AdminAutomationsPage')
const AdminLogsPage = lazyNamed(() => import('./pages/admin/AdminLogsPage'), 'AdminLogsPage')
const AdminSupportPage = lazyNamed(() => import('./pages/admin/AdminSupportPage'), 'AdminSupportPage')
const AdminNotificationsPage = lazyNamed(() => import('./pages/admin/AdminNotificationsPage'), 'AdminNotificationsPage')
const AdminSettingsPage = lazyNamed(() => import('./pages/admin/AdminSettingsPage'), 'AdminSettingsPage')

const retryNetworkFailure = (failureCount: number, error: unknown) => {
  const status = (error as AxiosError | undefined)?.response?.status
  return (!status || status >= 500) && failureCount < 2
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: apiStaleTimes.standard,
      gcTime: apiStaleTimes.static,
      refetchOnWindowFocus: false,
      retry: retryNetworkFailure,
    },
    mutations: {
      onError: (error) => {
        if (import.meta.env.DEV) console.error(error)
      },
    },
  },
})

const routeElement = (children: ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<RouteLoader />}>{children}</Suspense>
  </ErrorBoundary>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

const pageTitles: Array<[RegExp, string]> = [
  [/^\/$/, 'Bridgr'],
  [/^\/login$/, 'Worker Login | Bridgr'],
  [/^\/client\/login$/, 'Client Login | Bridgr'],
  [/^\/admin\/login$/, 'Admin Login | Bridgr'],
  [/^\/register$/, 'Register | Bridgr'],
  [/^\/forgot-password$/, 'Forgot Password | Bridgr'],
  [/^\/verify-email\/[^/]+$/, 'Verify Email | Bridgr'],
  [/^\/w\/dashboard$/, 'Worker Dashboard | Bridgr'],
  [/^\/w\/jobs$/, 'Worker Jobs | Bridgr'],
  [/^\/w\/jobs\/[^/]+$/, 'Job Details | Bridgr'],
  [/^\/w\/applications$/, 'Worker Applications | Bridgr'],
  [/^\/w\/projects$/, 'Worker Projects | Bridgr'],
  [/^\/w\/projects\/[^/]+$/, 'Worker Workspace | Bridgr'],
  [/^\/w\/payments$/, 'Worker Payments | Bridgr'],
  [/^\/w\/profile$/, 'Worker Profile | Bridgr'],
  [/^\/w\/notifications$/, 'Worker Notifications | Bridgr'],
  [/^\/w\/settings$/, 'Worker Settings | Bridgr'],
  [/^\/c\/dashboard$/, 'Client Dashboard | Bridgr'],
  [/^\/c\/jobs\/new$/, 'Submit Job | Bridgr'],
  [/^\/c\/jobs$/, 'Client Jobs | Bridgr'],
  [/^\/c\/jobs\/[^/]+$/, 'Client Job Status | Bridgr'],
  [/^\/c\/payments$/, 'Client Payments | Bridgr'],
  [/^\/c\/profile$/, 'Client Profile | Bridgr'],
  [/^\/c\/support$/, 'Client Support | Bridgr'],
  [/^\/admin\/dashboard$/, 'Admin Dashboard | Bridgr'],
  [/^\/admin\/workers$/, 'Admin Workers | Bridgr'],
  [/^\/admin\/workers\/[^/]+$/, 'Worker Detail | Bridgr'],
  [/^\/admin\/verify$/, 'Verification Queue | Bridgr'],
  [/^\/admin\/clients$/, 'Admin Clients | Bridgr'],
  [/^\/admin\/jobs\/inbox(?:\/[^/]+)?$/, 'Job Inbox | Bridgr'],
  [/^\/admin\/jobs$/, 'Listings | Bridgr'],
  [/^\/admin\/jobs\/new$/, 'Create Listing | Bridgr'],
  [/^\/admin\/projects$/, 'Admin Projects | Bridgr'],
  [/^\/admin\/projects\/[^/]+$/, 'Admin Workspace | Bridgr'],
  [/^\/admin\/payments$/, 'Admin Payments | Bridgr'],
  [/^\/admin\/payments\/margin$/, 'Margin Report | Bridgr'],
  [/^\/admin\/logs$/, 'Admin Logs | Bridgr'],
  [/^\/admin\/notifications$/, 'Admin Notifications | Bridgr'],
  [/^\/admin\/settings$/, 'Admin Settings | Bridgr'],
]

const AppRoutes = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = pageTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Bridgr'
  }, [pathname])

  return (
          <Routes>
            <Route path="/" element={routeElement(<LandingPage />)} />
            <Route path="/login" element={routeElement(<WorkerLoginPage />)} />
            <Route path="/register" element={routeElement(<WorkerOnboardingPage />)} />
            <Route path="/client/login" element={routeElement(<ClientLoginPage />)} />
            <Route path="/admin/login" element={routeElement(<AdminLoginPage />)} />
            <Route path="/forgot-password" element={routeElement(<ForgotPasswordPage />)} />
            <Route path="/verify-email/:token" element={routeElement(<EmailVerifyPage />)} />
            <Route path="/affiliate/join" element={routeElement(<AffiliateSignupPage />)} />

            <Route path="/w" element={<WorkerRoute />}>
              <Route element={<WorkerLayout />}>
                <Route index element={<Navigate to="/w/dashboard" replace />} />
                <Route path="dashboard" element={routeElement(<WorkerDashboardPage />)} />
                <Route path="jobs" element={routeElement(<WorkerJobsPage />)} />
                <Route path="jobs/:id" element={routeElement(<WorkerJobDetailPage />)} />
                <Route path="applications" element={routeElement(<WorkerApplicationsPage />)} />
                <Route path="projects" element={routeElement(<WorkerProjectsPage />)} />
                <Route path="projects/:id" element={routeElement(<WorkerProjectWorkspacePage />)} />
                <Route path="tests" element={routeElement(<WorkerTestsPage />)} />
                <Route path="payments" element={routeElement(<WorkerPaymentsPage />)} />
                <Route path="profile" element={routeElement(<WorkerProfilePage />)} />
                <Route path="notifications" element={routeElement(<WorkerNotificationsPage />)} />
                <Route path="settings" element={routeElement(<WorkerSettingsPage />)} />
                <Route path="referral" element={routeElement(<WorkerReferralPage />)} />
              </Route>
            </Route>

            <Route path="/c" element={<ClientRoute />}>
              <Route element={<ClientLayout />}>
                <Route index element={<Navigate to="/c/dashboard" replace />} />
                <Route path="dashboard" element={routeElement(<ClientDashboardPage />)} />
                <Route path="jobs/new" element={routeElement(<ClientSubmitJobPage />)} />
                <Route path="jobs" element={routeElement(<ClientJobsPage />)} />
                <Route path="jobs/:id" element={routeElement(<ClientJobStatusPage />)} />
                <Route path="payments" element={routeElement(<ClientPaymentsPage />)} />
                <Route path="profile" element={routeElement(<ClientProfilePage />)} />
                <Route path="support" element={routeElement(<ClientSupportPage />)} />
              </Route>
            </Route>

            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={routeElement(<AdminDashboardPage />)} />
                <Route path="workers" element={routeElement(<AdminWorkersPage />)} />
                <Route path="workers/:id" element={routeElement(<AdminWorkerDetailPage />)} />
                <Route path="verify" element={routeElement(<AdminVerificationQueuePage />)} />
                <Route path="clients" element={routeElement(<AdminClientsPage />)} />
                <Route path="jobs/inbox" element={routeElement(<AdminJobInboxPage />)} />
                <Route path="jobs/inbox/:id" element={routeElement(<AdminJobInboxPage />)} />
                <Route path="jobs" element={routeElement(<AdminListingsPage />)} />
                <Route path="jobs/new" element={routeElement(<AdminCreateListingPage />)} />
                <Route path="projects" element={routeElement(<AdminProjectsPage />)} />
                <Route path="projects/:id" element={routeElement(<AdminProjectWorkspacePage />)} />
                <Route path="payments" element={routeElement(<AdminPaymentsPage />)} />
                <Route path="payments/margin" element={routeElement(<AdminMarginReportPage />)} />
                <Route path="logs" element={routeElement(<AdminLogsPage />)} />
                <Route path="analytics" element={routeElement(<AdminAnalyticsPage />)} />
                <Route path="referrals" element={routeElement(<AdminReferralsPage />)} />
                <Route path="tests" element={routeElement(<AdminTestsPage />)} />
                <Route path="tests/:id/questions" element={routeElement(<AdminTestsPage />)} />
                <Route path="tests/:id/results" element={routeElement(<AdminTestsPage />)} />
                <Route path="automations" element={routeElement(<AdminAutomationsPage />)} />
                <Route path="automations/:id/runs" element={routeElement(<AdminAutomationsPage />)} />
                <Route path="notifications" element={routeElement(<AdminNotificationsPage />)} />
                <Route path="support" element={routeElement(<AdminSupportPage />)} />
                <Route path="settings" element={routeElement(<AdminSettingsPage />)} />
              </Route>
            </Route>

            <Route path="/404" element={routeElement(<NotFoundPage />)} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
  )
}

export default App
