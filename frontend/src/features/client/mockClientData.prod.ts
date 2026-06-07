import type { ClientInvoice, ClientJob, ClientProfile, SupportTicket } from '../../api/clientPortal'

export const mockClientJobs: ClientJob[] = []
export const mockInvoices: ClientInvoice[] = []
export const mockProfile: ClientProfile = {
  companyName: '',
  contactName: '',
  email: '',
  country: '',
  billingAddress: '',
  paymentMethods: [],
  completedJobs: [],
}
export const mockTickets: SupportTicket[] = []
export const mockClientDashboard = {
  stats: {
    activeProjects: 0,
    totalSpent: 0,
    pendingPayments: 0,
    openJobs: 0,
    avgTimeToFill: 0,
  },
  activeProjects: [],
  activity: [],
  nextPayment: {
    project: '',
    amount: 0,
    due: '',
  },
}
