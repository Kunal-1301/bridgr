import { apiClient, dedupedGet, isApiMockEnabled } from './client'
import { asIso, pageItems, titleCase } from './normalize'
import type { ClientJobSubmissionPayload } from './schemas'
import { mockClientDashboard, mockClientJobs, mockInvoices, mockProfile, mockTickets } from '../features/client/mockClientData'

export type ClientJobStatus = 'Draft' | 'Under Review' | 'Active' | 'Completed'
export type ClientMilestoneStatus = 'Pending' | 'Paid' | 'Released' | 'Overdue'
export type InvoiceStatus = 'Paid' | 'Pending'
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved'

export interface ClientDashboardStats {
  activeProjects: number
  totalSpent: number
  pendingPayments: number
  openJobs: number
}

interface ClientDashboardActivity {
  id: string
  type: string
  message: string
  timestamp: string
}

interface ClientDashboardData {
  stats: ClientDashboardStats
  activeProjects: ClientJob[]
  activity: ClientDashboardActivity[]
}

export interface ClientMilestone {
  id: string
  name: string
  dueDate: string
  amount: number
  status: ClientMilestoneStatus
}

export interface ClientJob {
  id: string
  title: string
  description: string
  skills: string[]
  status: ClientJobStatus
  submissionDate: string
  budget: number
  paymentType: 'Fixed' | 'Milestone-based' | 'Hourly'
  progress: number
  milestones: ClientMilestone[]
  deliverables: { name: string; status: string }[]
  updates: { id: string; message: string; timestamp: string; type: string }[]
}

export interface ClientInvoice {
  id: string
  invoiceNo: string
  job: string
  amount: number
  date: string
  status: InvoiceStatus
}

export interface ClientProfile {
  companyName: string
  contactName: string
  email: string
  country: string
  billingAddress: string
  paymentMethods: { id: string; brand: string; last4: string; expiry: string }[]
  completedJobs: { id: string; title: string }[]
}

export interface SupportTicket {
  id: string
  subject: string
  category: string
  status: TicketStatus
  lastUpdated: string
  messages: { id: string; sender: 'Client' | 'Admin'; body: string; timestamp: string }[]
}

export interface ClientJobDraftPayload {
  title: string
  description: string
  skills: string[]
  paymentType: 'Fixed' | 'Milestone-based' | 'Hourly'
  fixedBudget?: number
  milestones?: { title: string; amount: number; dueDate: string }[]
  estimatedHours?: number
  hourlyRate?: number
  teamSize: number
  deadline: string
  deliverables: string[]
  notes?: string
  files?: string[]
}

export { clientKeys } from './queryKeys'

async function getOrMock<T>(path: string, mock: T, params?: Record<string, unknown>) {
  try {
    return await dedupedGet<T>(path, { params })
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return mock
  }
}

async function postOrMock<T>(path: string, body: unknown, mock: T) {
  try {
    const response = await apiClient.post<T>(path, body)
    return response.data
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return mock
  }
}

const toClientJob = (item: any): ClientJob => ({
  id: String(item.id),
  title: item.title ?? 'Untitled job',
  description: item.description ?? '',
  skills: item.skills ?? item.requiredSkills ?? [],
  status: titleCase(item.status ?? item.clientVisibleStatus, 'Under Review') as ClientJobStatus,
  submissionDate: asIso(item.submissionDate ?? item.createdAt),
  budget: Number(item.budget ?? item.clientBudgetAmount ?? 0),
  paymentType: item.paymentType ?? 'Fixed',
  progress: item.progress ?? (String(item.status ?? item.clientVisibleStatus).toLowerCase() === 'completed' ? 100 : 20),
  milestones: (item.milestones ?? []).map((milestone: any) => ({
    id: String(milestone.id),
    name: milestone.name ?? milestone.title ?? 'Milestone',
    dueDate: asIso(milestone.dueDate),
    amount: Number(milestone.amount ?? 0),
    status: titleCase(milestone.status, 'Pending') as ClientMilestoneStatus,
  })),
  deliverables: item.deliverables ?? [],
  updates: item.updates ?? [],
})

const toClientDashboard = (data: any): ClientDashboardData => ({
  stats: data?.stats ?? {
    activeProjects: data?.activeProjects ?? 0,
    totalSpent: data?.totalSpent ?? 0,
    pendingPayments: data?.pendingPayments ?? data?.pendingPaymentsAmount ?? 0,
    openJobs: data?.openJobs ?? data?.totalJobs ?? 0,
  },
  activeProjects: pageItems<any>(data?.activeProjectsList ?? data?.activeProjects).map(toClientJob),
  activity: data?.activity ?? (data?.recentJobStatuses ?? []).map((job: any) => ({
    id: String(job.id),
    type: 'Job',
    message: `${job.title} is ${titleCase(job.clientVisibleStatus ?? job.status)}`,
    timestamp: asIso(job.createdAt),
  })),
})

const toClientPayment = (item: any): ClientInvoice => ({
  id: String(item.id),
  invoiceNo: item.invoiceNo ?? String(item.id).slice(0, 8).toUpperCase(),
  job: item.job ?? item.projectId ?? 'Project payment',
  amount: Number(item.amount ?? 0),
  date: asIso(item.date ?? item.createdAt),
  status: String(item.status ?? '').toLowerCase() === 'paid' || String(item.status ?? '').toLowerCase() === 'received' ? 'Paid' : 'Pending',
})

const toClientProfile = (data: any): ClientProfile => ({
  companyName: data.companyName ?? '',
  contactName: data.contactName ?? '',
  email: data.email ?? data.userEmail ?? '',
  country: data.country ?? '',
  billingAddress: data.billingAddress ?? data.timezone ?? '',
  paymentMethods: data.paymentMethods ?? [],
  completedJobs: data.completedJobs ?? [],
})

const normalizeClientJobPayload = (payload: ClientJobSubmissionPayload | ClientJobDraftPayload): any => {
  if ('requiredSkills' in payload) return payload

  return {
    title: payload.title,
    description: payload.description,
    requiredSkills: payload.skills,
    paymentType: payload.paymentType,
    totalBudget: payload.paymentType === 'Fixed' ? payload.fixedBudget : undefined,
    clientBudgetAmount: payload.paymentType === 'Fixed' ? payload.fixedBudget : payload.milestones?.reduce((sum, item) => sum + item.amount, 0) ?? payload.hourlyRate ?? 0,
    category: payload.skills[0] ?? 'general',
    milestones: payload.paymentType === 'Milestone-based' ? payload.milestones : undefined,
    estimatedHours: payload.paymentType === 'Hourly' ? payload.estimatedHours : undefined,
    hourlyRate: payload.paymentType === 'Hourly' ? payload.hourlyRate : undefined,
    teamSize: payload.teamSize,
    deadline: payload.deadline,
    deliverables: payload.deliverables,
    notes: payload.notes,
    attachmentKeys: payload.files,
  }
}

export const getClientDashboard = async () => {
  return toClientDashboard(await getOrMock('/client/dashboard', mockClientDashboard))
}

export const getClientJobs = async () => pageItems<any>(await getOrMock('/client/jobs', mockClientJobs)).map(toClientJob)
export const getClientJob = async (id: string) => toClientJob(await getOrMock(`/client/jobs/${id}`, mockClientJobs.find((job) => job.id === id) || mockClientJobs[0]))
export const getClientJobById = getClientJob
export const submitClientJob = (payload: ClientJobSubmissionPayload | ClientJobDraftPayload) => postOrMock('/client/jobs', normalizeClientJobPayload(payload), { id: 'tracking-1024', status: 'Under Review' })
export const payMilestone = (jobId: string, milestoneId: string) => postOrMock('/payments/stripe/checkout', { jobId, milestoneId }, { checkoutUrl: '#' })
export const getClientPayments = async () => {
  const data = await getOrMock<any>('/client/payments', { invoices: mockInvoices, summary: { totalSpent: 6600, thisMonth: 2600, outstanding: 2600 } })
  const invoices = data?.invoices ? data.invoices : pageItems<any>(data).map(toClientPayment)
  return {
    invoices,
    summary: data?.summary ?? {
      totalSpent: invoices.filter((item: ClientInvoice) => item.status === 'Paid').reduce((sum: number, item: ClientInvoice) => sum + item.amount, 0),
      thisMonth: invoices.reduce((sum: number, item: ClientInvoice) => sum + item.amount, 0),
      outstanding: invoices.filter((item: ClientInvoice) => item.status === 'Pending').reduce((sum: number, item: ClientInvoice) => sum + item.amount, 0),
    },
  }
}
export const getClientProfile = async () => toClientProfile(await getOrMock('/client/profile', mockProfile))
export const updateClientProfile = (payload: Partial<ClientProfile>) => apiClient.patch('/client/profile', payload).then((response) => toClientProfile(response.data))
export const createSetupIntent = () => postOrMock('/payments/stripe/setup-intent', {}, { clientSecret: 'setup_mock' })
export const getSupportTickets = () => {
  if (!isApiMockEnabled()) return Promise.resolve([])
  return getOrMock('/client/support', mockTickets)
}
export const createSupportTicket = (payload: unknown) => postOrMock('/client/support', payload, { ok: true })
export const replyToTicket = (id: string, body: string) => postOrMock(`/support/tickets/${id}/reply`, { body }, { ok: true })
