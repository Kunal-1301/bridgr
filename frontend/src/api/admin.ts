import { addDays, subDays, subMonths } from 'date-fns'
import { apiClient, dedupedGet, isApiMockEnabled } from './client'
import { asIso, pageItems, titleCase } from './normalize'
import type { Tier } from './worker'
import type { JobListingCreationPayload, PaymentMarkingPayload } from './schemas'

export type WorkerStatus = 'Pending' | 'Approved' | 'Under Review' | 'Rejected' | 'Suspended' | 'Flagged'
export type ClientStatus = 'Active' | 'Inactive'
export type ListingStatus = 'Draft' | 'Open' | 'In Progress' | 'Closed'
export type ListingVisibility = 'Open' | 'Skills-filtered' | 'Invite-only'
export type AdminProjectStatus = 'Active' | 'Completed' | 'Paused'
export type AdminTaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done'
export type LedgerStatus = 'Paid' | 'Pending' | 'Scheduled' | 'Held' | 'Received'
export type ReferralStatus = 'Pending' | 'Converted' | 'Paid'
export type SupportStatus = 'Open' | 'In Progress' | 'Resolved'

export interface AdminWorker {
  id: string
  fullName: string
  email: string
  phone: string
  city: string
  dateOfBirth: string
  bio: string
  skills: string[]
  experience: string
  rateMin: number
  rateMax: number
  tier: Tier
  trustScore: number
  status: WorkerStatus
  joinedDate: string
  submittedDate: string
  documents: { resume: boolean; id: boolean; portfolio: boolean; idType: string }
  testScore?: number
  adminNotes: string
  applications: { id: string; jobTitle: string; status: string; date: string; outcome: string }[]
  projects: { id: string; title: string; role: string; dates: string; outcome: string }[]
  certifications: { id: string; name: string; score: number; issuedDate: string }[]
  activity: { id: string; action: string; timestamp: string }[]
}

export interface AdminClient {
  id: string
  company: string
  country: string
  contact: string
  email: string
  activeProjects: number
  totalSpent: number
  joined: string
  status: ClientStatus
  projects: { id: string; title: string; status: string; budget: number }[]
  payments: { total: number; outstanding: number; lastInvoice: string }
}

export interface AdminJobInboxItem {
  id: string
  title: string
  clientCompany: string
  clientContact?: string
  budget: number
  skills?: string[]
  teamSize?: number
  deadline?: string
  submitted: string
  description?: string
  deliverables?: string[]
}

export interface AdminListing {
  id: string
  title: string
  sourceJobId: string
  sourceJobTitle: string
  workerBudget: number
  status: ListingStatus
  visibility: ListingVisibility
  applications: number
  created: string
  skills: string[]
  minTier: Tier
}

export interface SuggestedWorker {
  id: string
  fullName: string
  tier: Tier
  trustScore: number
  matchScore: number
  relevantSkills: string[]
}

export interface AdminProject {
  id: string
  title: string
  client: string
  workers: { id: string; name: string; initials: string; role: string; online: boolean }[]
  status: AdminProjectStatus
  startDate: string
  endDate: string
  channels: string[]
  files: { name: string; size: string }[]
  milestones: { id: string; title: string; amount: number; status: string; dueDate: string }[]
  privateNotes: string
}

export interface AdminWorkspaceMessage {
  id: string
  senderName: string
  senderInitials: string
  senderRole: 'Admin' | 'Worker'
  body: string
  timestamp: string
  pinned?: boolean
  attachments?: { name: string; size: string }[]
}

export interface AdminTask {
  id: string
  title: string
  status: AdminTaskStatus
  assignee: string
  dueDate: string
}

export interface AdminApplication {
  id: string
  workerId: string
  workerName: string
  jobTitle: string
  status: string
  appliedDate: string
  outcome: string
}

interface AdminDashboardData {
  kpis: {
    revenueMtd: number
    payoutsMtd: number
    margin: number
    marginPct: number
    activeProjects: number
    pendingVerifications: number
  }
  revenue: { month: string; revenue: number; payouts: number; margin: number }[]
  pendingWorkers: AdminWorker[]
  jobInbox: AdminJobInboxItem[]
  counts: {
    totalWorkers: number
    approved: number
    pending: number
    suspended: number
    totalClients: number
    activeClients: number
  }
  automationRuns: { id: string; rule: string; trigger: string; outcome: string; timestamp: string }[]
}

export { adminKeys } from './queryKeys'

const revenue = Array.from({ length: 12 }).map((_, index) => {
  const revenue = 28000 + index * 4200
  const payouts = 17000 + index * 2600
  return {
    month: subMonths(new Date(), 11 - index).toLocaleString('en-US', { month: 'short' }),
    revenue,
    payouts,
    margin: revenue - payouts,
  }
})

export const mockAdminWorkers: AdminWorker[] = [
  {
    id: 'w-1',
    fullName: 'Arjun Kumar',
    email: 'arjun@example.in',
    phone: '+91 98765 43210',
    city: 'Bengaluru',
    dateOfBirth: '1996-08-12',
    bio: 'Senior frontend engineer focused on dashboards and delivery systems.',
    skills: ['React', 'TypeScript', 'Charts'],
    experience: 'Senior',
    rateMin: 1200,
    rateMax: 2200,
    tier: 'certified',
    trustScore: 85,
    status: 'Approved',
    joinedDate: subDays(new Date(), 92).toISOString(),
    submittedDate: subDays(new Date(), 96).toISOString(),
    documents: { resume: true, id: true, portfolio: true, idType: 'PAN' },
    testScore: 86,
    adminNotes: 'Strong React fit. Reliable on async updates.',
    applications: [{ id: 'a1', jobTitle: 'Ops Dashboard Build', status: 'Selected', date: subDays(new Date(), 22).toISOString(), outcome: 'Assigned' }],
    projects: [{ id: 'p1', title: 'Ops Dashboard Delivery', role: 'Frontend', dates: 'May-Jun 2026', outcome: 'Active' }],
    certifications: [{ id: 'c1', name: 'React Certified Worker', score: 86, issuedDate: subDays(new Date(), 44).toISOString() }],
    activity: [{ id: 'log1', action: 'Approved by admin', timestamp: subDays(new Date(), 90).toISOString() }],
  },
  {
    id: 'w-2',
    fullName: 'Neha Verma',
    email: 'neha@example.in',
    phone: '+91 90000 12000',
    city: 'Pune',
    dateOfBirth: '1998-02-03',
    bio: 'SEO writer with B2B content experience.',
    skills: ['Writing', 'SEO', 'Research'],
    experience: 'Mid',
    rateMin: 700,
    rateMax: 1400,
    tier: 'verified',
    trustScore: 72,
    status: 'Pending',
    joinedDate: subDays(new Date(), 3).toISOString(),
    submittedDate: subDays(new Date(), 3).toISOString(),
    documents: { resume: true, id: true, portfolio: false, idType: 'Aadhaar' },
    testScore: 78,
    adminNotes: '',
    applications: [],
    projects: [],
    certifications: [],
    activity: [{ id: 'log2', action: 'Submitted worker application', timestamp: subDays(new Date(), 3).toISOString() }],
  },
  {
    id: 'w-3',
    fullName: 'Prakash Iyer',
    email: 'prakash@example.in',
    phone: '+91 98888 55555',
    city: 'Chennai',
    dateOfBirth: '1993-11-20',
    bio: 'Python automation specialist.',
    skills: ['Python', 'Pandas', 'Automation'],
    experience: 'Expert',
    rateMin: 1500,
    rateMax: 2600,
    tier: 'pro',
    trustScore: 91,
    status: 'Flagged',
    joinedDate: subDays(new Date(), 180).toISOString(),
    submittedDate: subDays(new Date(), 184).toISOString(),
    documents: { resume: true, id: true, portfolio: true, idType: 'Passport' },
    testScore: 92,
    adminNotes: 'Flagged for manual payout review.',
    applications: [{ id: 'a2', jobTitle: 'Python Data Cleanup', status: 'Shortlisted', date: subDays(new Date(), 5).toISOString(), outcome: 'Reviewing' }],
    projects: [{ id: 'p2', title: 'Automation Scripts V1', role: 'Backend', dates: 'Apr 2026', outcome: 'Completed' }],
    certifications: [{ id: 'c2', name: 'Python Data Automation', score: 92, issuedDate: subDays(new Date(), 70).toISOString() }],
    activity: [{ id: 'log3', action: 'Admin flag added', timestamp: subDays(new Date(), 2).toISOString() }],
  },
]

export const mockAdminClients: AdminClient[] = [
  {
    id: 'cl-1',
    company: 'Northstar Labs',
    country: 'United States',
    contact: 'Maya Reynolds',
    email: 'maya@northstar.example',
    activeProjects: 2,
    totalSpent: 6600,
    joined: subDays(new Date(), 120).toISOString(),
    status: 'Active',
    projects: [{ id: 'cj-1', title: 'Operations Dashboard Build', status: 'Active', budget: 6200 }],
    payments: { total: 6600, outstanding: 2600, lastInvoice: 'BR-1012' },
  },
  {
    id: 'cl-2',
    company: 'Brightline Media',
    country: 'United States',
    contact: 'Jon Pierce',
    email: 'jon@brightline.example',
    activeProjects: 1,
    totalSpent: 12400,
    joined: subDays(new Date(), 210).toISOString(),
    status: 'Active',
    projects: [{ id: 'cj-8', title: 'SEO Content Retainer', status: 'Active', budget: 8400 }],
    payments: { total: 12400, outstanding: 0, lastInvoice: 'BR-1009' },
  },
]

export const mockInbox: AdminJobInboxItem[] = [
  {
    id: 'in-1',
    title: 'SEO Content Batch',
    clientCompany: 'Northstar Labs',
    clientContact: 'Maya Reynolds',
    budget: 3400,
    skills: ['SEO', 'Writing', 'Research'],
    teamSize: 2,
    deadline: addDays(new Date(), 24).toISOString(),
    submitted: subDays(new Date(), 3).toISOString(),
    description: 'Produce a batch of search-optimized articles from provided topic briefs.',
    deliverables: ['12 article drafts', 'Metadata sheet', 'Revision pass'],
  },
  {
    id: 'in-2',
    title: 'Video Editing Sprint',
    clientCompany: 'Brightline Media',
    clientContact: 'Jon Pierce',
    budget: 5200,
    skills: ['Video Editing', 'Captions', 'Motion'],
    teamSize: 3,
    deadline: addDays(new Date(), 18).toISOString(),
    submitted: subDays(new Date(), 1).toISOString(),
    description: 'Edit short-form videos from raw footage with captions and export package.',
    deliverables: ['20 edited clips', 'Caption files', 'Export-ready assets'],
  },
]

export const mockListings: AdminListing[] = [
  {
    id: 'jl-1',
    title: 'Search Content Production Pack',
    sourceJobId: 'in-1',
    sourceJobTitle: 'SEO Content Batch',
    workerBudget: 2250,
    status: 'Open',
    visibility: 'Skills-filtered',
    applications: 14,
    created: subDays(new Date(), 2).toISOString(),
    skills: ['SEO', 'Writing'],
    minTier: 'verified',
  },
  {
    id: 'jl-2',
    title: 'Operations Dashboard Delivery',
    sourceJobId: 'in-3',
    sourceJobTitle: 'Internal Reporting Dashboard',
    workerBudget: 4100,
    status: 'In Progress',
    visibility: 'Invite-only',
    applications: 8,
    created: subDays(new Date(), 20).toISOString(),
    skills: ['React', 'TypeScript', 'Charts'],
    minTier: 'certified',
  },
]

export const mockAdminProjects: AdminProject[] = [
  {
    id: 'ap-1',
    title: 'Operations Dashboard Delivery',
    client: 'Northstar Labs',
    workers: [
      { id: 'w-1', name: 'Arjun Kumar', initials: 'AK', role: 'Frontend', online: true },
      { id: 'w-3', name: 'Prakash Iyer', initials: 'PI', role: 'Automation', online: false },
    ],
    status: 'Active',
    startDate: subDays(new Date(), 18).toISOString(),
    endDate: addDays(new Date(), 16).toISOString(),
    channels: ['general', 'deliverables', 'updates', 'Admin Announcements'],
    files: [{ name: 'dashboard-wireframes.pdf', size: '1.8MB' }],
    milestones: [
      { id: 'ms-1', title: 'UX shell', amount: 1800, status: 'Complete', dueDate: subDays(new Date(), 4).toISOString() },
      { id: 'ms-2', title: 'Data views', amount: 2600, status: 'In Review', dueDate: addDays(new Date(), 5).toISOString() },
    ],
    privateNotes: 'Client prefers concise weekly updates. Keep worker discussion internal.',
  },
  {
    id: 'ap-2',
    title: 'SEO Retainer Batch',
    client: 'Brightline Media',
    workers: [{ id: 'w-2', name: 'Neha Verma', initials: 'NV', role: 'Writer', online: true }],
    status: 'Paused',
    startDate: subDays(new Date(), 35).toISOString(),
    endDate: addDays(new Date(), 25).toISOString(),
    channels: ['general', 'deliverables', 'updates', 'Admin Announcements'],
    files: [],
    milestones: [{ id: 'ms-3', title: 'Article pack', amount: 3200, status: 'Paused', dueDate: addDays(new Date(), 14).toISOString() }],
    privateNotes: 'Paused pending client outline approval.',
  },
]

const mockProjectMessages: AdminWorkspaceMessage[] = [
  { id: 'awm-1', senderName: 'Admin', senderInitials: 'AD', senderRole: 'Admin', body: 'Client confirmed milestone scope. Keep progress updates in this channel.', timestamp: subDays(new Date(), 2).toISOString(), pinned: true },
  { id: 'awm-2', senderName: 'Arjun Kumar', senderInitials: 'AK', senderRole: 'Worker', body: 'Dashboard shell is ready for review. Uploading the latest screens.', timestamp: subDays(new Date(), 1).toISOString(), attachments: [{ name: 'screens.zip', size: '4.2MB' }] },
]

const mockProjectTasks: AdminTask[] = [
  { id: 'at-1', title: 'Finalize chart states', status: 'In Progress', assignee: 'AK', dueDate: addDays(new Date(), 2).toISOString() },
  { id: 'at-2', title: 'QA payout report flow', status: 'Review', assignee: 'PI', dueDate: addDays(new Date(), 4).toISOString() },
  { id: 'at-3', title: 'Draft client update', status: 'To Do', assignee: 'AD', dueDate: addDays(new Date(), 1).toISOString() },
]

async function getOrMock<T>(path: string, mock: T, params?: Record<string, unknown>) {
  try {
    return await dedupedGet<T>(path, { params })
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return mock
  }
}

async function patchOrMock<T>(path: string, body: unknown, mock: T) {
  try {
    const response = await apiClient.patch<T>(path, body)
    return response.data
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

const statusFromVerification = (value: unknown): WorkerStatus => {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('approved') || text === 'verified') return 'Approved'
  if (text.includes('reject')) return 'Rejected'
  if (text.includes('suspend')) return 'Suspended'
  if (text.includes('review')) return 'Under Review'
  return 'Pending'
}

const toAdminWorker = (item: any): AdminWorker => ({
  id: String(item.id ?? item.profileId),
  fullName: item.fullName ?? '',
  email: item.email ?? '',
  phone: item.phone ?? '',
  city: item.city ?? '',
  dateOfBirth: item.dateOfBirth ?? '',
  bio: item.bio ?? item.headline ?? '',
  skills: item.skills ?? [],
  experience: item.experience ?? item.experienceLevel ?? '',
  rateMin: item.rateMin ?? item.hourlyRateMinInr ?? 0,
  rateMax: item.rateMax ?? item.hourlyRateMaxInr ?? 0,
  tier: (item.tier ?? 'newcomer') as Tier,
  trustScore: item.trustScore ?? 0,
  status: item.status ?? statusFromVerification(item.verificationStatus),
  joinedDate: asIso(item.joinedDate ?? item.createdAt),
  submittedDate: asIso(item.submittedDate ?? item.createdAt),
  documents: item.documents ?? { resume: false, id: false, portfolio: false, idType: '' },
  testScore: item.testScore,
  adminNotes: item.adminNotes ?? '',
  applications: item.applications ?? [],
  projects: item.projects ?? [],
  certifications: item.certifications ?? [],
  activity: item.activity ?? [],
})

const toAdminClient = (item: any): AdminClient => ({
  id: String(item.id ?? item.profileId),
  company: item.company ?? item.companyName ?? '',
  country: item.country ?? '',
  contact: item.contact ?? item.contactName ?? '',
  email: item.email ?? item.userEmail ?? item.contactEmail ?? '',
  activeProjects: item.activeProjects ?? 0,
  totalSpent: item.totalSpent ?? 0,
  joined: asIso(item.joined ?? item.createdAt),
  status: titleCase(item.status, 'Active') as ClientStatus,
  projects: item.projects ?? [],
  payments: item.payments ?? { total: item.totalSpent ?? 0, outstanding: 0, lastInvoice: '' },
})

const toInboxItem = (item: any): AdminJobInboxItem => ({
  id: String(item.id),
  title: item.title ?? '',
  clientCompany: item.clientCompany ?? item.companyName ?? 'Client',
  clientContact: item.clientContact,
  budget: item.budget ?? item.clientBudgetAmount ?? 0,
  skills: item.skills ?? item.requiredSkills ?? [],
  teamSize: item.teamSize ?? item.expectedTeamSize,
  deadline: item.deadline,
  submitted: asIso(item.submitted ?? item.createdAt),
  description: item.description,
  deliverables: item.deliverables ?? [],
})

const toListing = (item: any): AdminListing => ({
  id: String(item.id),
  title: item.title ?? '',
  sourceJobId: String(item.sourceJobId ?? item.clientJobId ?? ''),
  sourceJobTitle: item.sourceJobTitle ?? item.title ?? '',
  workerBudget: item.workerBudget ?? item.workerBudgetAmount ?? 0,
  status: titleCase(item.status, 'Draft') as ListingStatus,
  visibility: item.visibility === 'all_verified' ? 'Open' : titleCase(item.visibility, 'Open') as ListingVisibility,
  applications: item.applications ?? 0,
  created: asIso(item.created ?? item.createdAt),
  skills: item.skills ?? item.requiredSkills ?? [],
  minTier: (item.minTier ?? 'verified') as Tier,
})

const toAdminProject = (item: any): AdminProject => ({
  id: String(item.id),
  title: item.title ?? '',
  client: item.client ?? item.clientJobId ?? 'Client',
  workers: item.workers ?? [],
  status: titleCase(item.status, 'Active') as AdminProjectStatus,
  startDate: asIso(item.startDate ?? item.createdAt),
  endDate: asIso(item.endDate ?? item.dueDate),
  channels: item.channels ?? [],
  files: item.files ?? [],
  milestones: item.milestones ?? [],
  privateNotes: item.privateNotes ?? item.internalDescription ?? '',
})

const toAuditLog = (item: any) => ({
  id: String(item.id),
  timestamp: asIso(item.timestamp ?? item.createdAt),
  actor: item.actor ?? item.actorUserId ?? 'System',
  actionType: item.actionType ?? titleCase(item.action, 'Update'),
  description: item.description ?? item.action ?? '',
  affectedRecord: item.affectedRecord ?? [item.entityType, item.entityId].filter(Boolean).join('/'),
  ip: item.ip ?? item.ipAddress ?? '',
})

const toDashboard = (data: any): AdminDashboardData => ({
  kpis: data?.kpis ?? {
    revenueMtd: data?.inboundThisMonth ?? 0,
    payoutsMtd: data?.payoutsThisMonth ?? 0,
    margin: data?.grossMarginThisMonth ?? 0,
    marginPct: data?.inboundThisMonth ? Math.round((data.grossMarginThisMonth / data.inboundThisMonth) * 1000) / 10 : 0,
    activeProjects: data?.activeProjects ?? 0,
    pendingVerifications: data?.pendingVerificationWorkers ?? 0,
  },
  revenue: data?.revenue ?? [],
  pendingWorkers: (data?.pendingWorkers ?? []).map(toAdminWorker),
  jobInbox: (data?.jobInbox ?? []).map(toInboxItem),
  counts: data?.counts ?? {
    totalWorkers: data?.totalWorkers ?? 0,
    approved: 0,
    pending: data?.pendingVerificationWorkers ?? 0,
    suspended: 0,
    totalClients: data?.totalClients ?? 0,
    activeClients: data?.totalClients ?? 0,
  },
  automationRuns: (data?.automationRuns ?? data?.recentAuditLogs ?? []).map((item: any) => ({
    id: String(item.id),
    rule: item.rule ?? item.action ?? 'System event',
    trigger: item.trigger ?? item.entityType ?? '',
    outcome: item.outcome ?? titleCase(item.action, 'Completed'),
    timestamp: asIso(item.timestamp ?? item.createdAt),
  })),
})

export const getAdminDashboard = async () => toDashboard(await getOrMock('/admin/dashboard', {
  kpis: {
    revenueMtd: 64200,
    payoutsMtd: 38600,
    margin: 25600,
    marginPct: 39.9,
    activeProjects: 18,
    pendingVerifications: mockAdminWorkers.filter((worker) => worker.status === 'Pending').length,
  },
  revenue,
  pendingWorkers: mockAdminWorkers.filter((worker) => worker.status === 'Pending'),
  jobInbox: mockInbox,
  counts: { totalWorkers: 248, approved: 191, pending: 8, suspended: 6, totalClients: 42, activeClients: 31 },
  automationRuns: [
    { id: 'ar1', rule: 'Welcome Email', trigger: 'Worker approved', outcome: 'Sent', timestamp: subDays(new Date(), 1).toISOString() },
    { id: 'ar2', rule: 'Payment Reminder', trigger: 'Milestone pending', outcome: 'Queued', timestamp: subDays(new Date(), 1).toISOString() },
    { id: 'ar3', rule: 'Trust Recalc', trigger: 'Project completed', outcome: 'Success', timestamp: subDays(new Date(), 2).toISOString() },
    { id: 'ar4', rule: 'Client Digest', trigger: 'Daily schedule', outcome: 'Sent', timestamp: subDays(new Date(), 2).toISOString() },
    { id: 'ar5', rule: 'Flag Review', trigger: 'Risk signal', outcome: 'Escalated', timestamp: subDays(new Date(), 3).toISOString() },
  ],
}))

export const getAdminWorkers = async (filters?: Record<string, unknown>) => pageItems<any>(await getOrMock('/admin/workers', mockAdminWorkers, filters)).map(toAdminWorker)
export const getAdminWorker = async (id: string) => toAdminWorker(await getOrMock(`/admin/workers/${id}`, mockAdminWorkers.find((worker) => worker.id === id) || mockAdminWorkers[0]))
export const updateWorkerVerification = (id: string, payload: unknown) => patchOrMock(`/admin/workers/${id}`, payload, { ok: true })
export const updateWorkerNotes = (id: string, adminNotes: string) => patchOrMock(`/admin/workers/${id}`, { admin_notes: adminNotes }, { ok: true })
export const recalculateWorkerTrust = (id: string, payload: unknown) => postOrMock(`/admin/workers/${id}/trust/recalculate`, payload, { score: 88 })
export const getVerificationQueue = async () => pageItems<any>(await getOrMock('/admin/workers', mockAdminWorkers.filter((worker) => worker.status === 'Pending'), { verificationStatus: 'submitted' })).map(toAdminWorker)
export const getAdminClients = async (filters?: Record<string, unknown>) => pageItems<any>(await getOrMock('/admin/clients', mockAdminClients, filters)).map(toAdminClient)
export const createAdminClient = (payload: unknown) => postOrMock('/admin/clients', payload, { inviteLink: 'https://bridgr.app/client/invite/mock' })
export const updateAdminClient = (id: string, payload: unknown) => patchOrMock(`/admin/clients/${id}`, payload, { ok: true })
export const getAdminJobInbox = async (filters?: Record<string, unknown>) => pageItems<any>(await getOrMock('/admin/client-jobs', mockInbox, filters)).map(toInboxItem)
export const getAdminListings = async (filters?: Record<string, unknown>) => pageItems<any>(await getOrMock('/admin/job-listings', mockListings, filters)).map(toListing)
export const createAdminListing = (payload: unknown) => postOrMock('/admin/job-listings', payload, { id: 'jl-new', status: 'Open' })
export const updateInboxJobAction = (id: string, action: string, payload?: unknown) => patchOrMock(`/admin/client-jobs/${id}`, { action, payload }, { ok: true })
export const getSuggestedWorkers = (skills: string[]) => {
  const suggestions = mockAdminWorkers
    .map((worker) => {
      const relevantSkills = worker.skills.filter((skill) => skills.map((item) => item.toLowerCase()).includes(skill.toLowerCase()))
      return {
        id: worker.id,
        fullName: worker.fullName,
        tier: worker.tier,
        trustScore: worker.trustScore,
        matchScore: Math.min(98, Math.round(worker.trustScore * 0.58 + relevantSkills.length * 14 + (worker.certifications.length ? 8 : 0))),
        relevantSkills: relevantSkills.length ? relevantSkills : worker.skills.slice(0, 2),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10)
  return getOrMock('/jobs/suggested-workers', suggestions)
}
export const getAdminProjects = async (filters?: Record<string, unknown>) => pageItems<any>(await getOrMock('/admin/projects', mockAdminProjects, filters)).map(toAdminProject)
export const getAdminProject = async (id: string) => toAdminProject(await getOrMock(`/admin/projects/${id}`, mockAdminProjects.find((project) => project.id === id) || mockAdminProjects[0]))
export const getAdminProjectMessages = async (id: string) => pageItems<any>(await getOrMock(`/admin/projects/${id}/messages`, mockProjectMessages)).map((item: any) => ({
  id: String(item.id),
  senderName: item.senderName ?? 'Admin',
  senderInitials: item.senderInitials ?? 'AD',
  senderRole: item.senderRole ?? 'Admin',
  body: item.body ?? item.content ?? '',
  timestamp: asIso(item.timestamp ?? item.createdAt),
  pinned: item.pinned,
  attachments: item.attachments ?? [],
}))
export const getAdminProjectTasks = (id: string) => getOrMock(`/admin/projects/${id}/tasks`, mockProjectTasks)
export const updateAdminProject = (id: string, payload: unknown) => patchOrMock(`/admin/projects/${id}`, payload, { ok: true })
export const createAdminTask = (projectId: string, payload: unknown) => postOrMock(`/admin/projects/${projectId}/tasks`, payload, { ok: true })
export const sendAdminWorkspaceMessage = (projectId: string, payload: unknown) => postOrMock(`/admin/projects/${projectId}/messages`, payload, { ok: true })

const marginRows = mockAdminProjects.map((project, index) => ({
  id: `mr-${project.id}`,
  project: project.title,
  client: project.client,
  clientPaid: 6200 + index * 2100,
  workersPaid: 310000 + index * 95000,
  exchangeRate: 83.2,
  grossMargin: 2500 + index * 800,
  netMarginPct: 38 + index * 4,
  period: 'Jun 2026',
}))

const mockPaymentItems = [
  { id: 'inpay-1', projectId: null, payerType: 'client', payeeType: 'bridgr', clientId: 'cl-1', workerId: null, amount: 2600, currency: 'USD', paymentDirection: 'inbound_client_payment' as const, paymentMethod: 'stripe', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'inpay-2', projectId: null, payerType: 'client', payeeType: 'bridgr', clientId: 'cl-2', workerId: null, amount: 4200, currency: 'USD', paymentDirection: 'inbound_client_payment' as const, paymentMethod: 'bank_transfer', status: 'received', createdAt: subDays(new Date(), 4).toISOString() },
  { id: 'outpay-1', projectId: null, payerType: 'bridgr', payeeType: 'worker', clientId: null, workerId: 'w-1', amount: 128000, currency: 'INR', paymentDirection: 'outbound_worker_payout' as const, paymentMethod: 'upi', status: 'pending', createdAt: addDays(new Date(), 2).toISOString() },
  { id: 'outpay-2', projectId: null, payerType: 'bridgr', payeeType: 'worker', clientId: null, workerId: 'w-2', amount: 74000, currency: 'INR', paymentDirection: 'outbound_worker_payout' as const, paymentMethod: 'bank_transfer', status: 'pending', createdAt: addDays(new Date(), 5).toISOString() },
]

export const getAdminPayments = (params?: Record<string, unknown>) => getOrMock('/admin/payments', { items: mockPaymentItems, total: mockPaymentItems.length, page: 1, pageSize: 20, totalPages: 1 }, params)

export const getAdminMarginReport = async () => {
  const data = await getOrMock<any>('/admin/payments/margin-report', { rows: marginRows, chart: marginRows.map((row) => ({ project: row.project.slice(0, 14), revenue: row.clientPaid, margin: row.grossMargin })) })
  if (data.rows) return data
  const rows = (data.byProject ?? []).map((row: any, index: number) => ({
    id: row.projectId ?? `mr-${index}`,
    project: row.projectTitle ?? row.project ?? 'Project',
    client: row.client ?? '',
    clientPaid: row.clientReceived ?? row.clientPaid ?? 0,
    workersPaid: row.workerPayouts ?? row.workersPaid ?? 0,
    exchangeRate: row.exchangeRate ?? 1,
    grossMargin: row.grossMargin ?? 0,
    netMarginPct: row.marginPct ?? 0,
    period: row.period ?? 'Current',
  }))
  return { rows, chart: rows.map((row: any) => ({ project: row.project.slice(0, 14), revenue: row.clientPaid, margin: row.grossMargin })) }
}
export const getAdminAnalytics = () => getOrMock('/analytics/admin', {
  revenue: { mtd: 64200, ytd: 412000, payoutsMtd: 38600, payoutsYtd: 245000, margin: 25600, marginPct: 39.9, delta: 12, chart: revenue },
  forecast: { nextMonth: 73800, pipeline: 121000, workerPayout: 45200, accuracy: 91 },
  workers: { byStatus: [{ name: 'Approved', value: 191 }, { name: 'Pending', value: 8 }, { name: 'Suspended', value: 6 }], skills: [{ skill: 'React', count: 58 }, { skill: 'SEO', count: 44 }, { skill: 'Python', count: 39 }, { skill: 'Design', count: 33 }], certRate: 42, avgTrust: 78, retention: 86 },
  clients: { active: 31, repeatRate: 64, avgJobValue: 4800, top: mockAdminClients.map((client) => ({ company: client.company, ltv: client.totalSpent, projects: client.activeProjects + 3 })) },
  health: { fillTime: 4.2, applicationRate: 17, automationHitRate: 63, funnel: [{ stage: 'Clicks', value: 1200 }, { stage: 'Sign-ups', value: 320 }, { stage: 'Approvals', value: 118 }, { stage: 'First Project', value: 46 }] },
})

export const getAdminReferrals = () => getOrMock('/referrals', {
  stats: { total: 342, conversions: 86, pending: 18200, paid: 96400 },
  rows: [
    { id: 'ref-1', referrer: 'Arjun Kumar', code: 'ARJUN42', referredUser: 'Ravi Shah', type: 'Worker', status: 'Converted' as ReferralStatus, amount: 500, date: subDays(new Date(), 6).toISOString() },
    { id: 'ref-2', referrer: 'Campus Partner', code: 'CAMPUS10', referredUser: 'ScaleOps LLC', type: 'Client', status: 'Pending' as ReferralStatus, amount: 0, date: subDays(new Date(), 2).toISOString() },
  ],
  affiliates: [
    { id: 'aff-1', company: 'SkillBridge College', contact: 'ops@skillbridge.example', commission: '₹300 per approved worker', clicks: 820, signups: 144, conversions: 52, earned: 15600 },
    { id: 'aff-2', company: 'Remote Talent Hub', contact: 'partners@rth.example', commission: '8% margin share', clicks: 430, signups: 49, conversions: 11, earned: 22400 },
  ],
})

export const getAdminTests = () => getOrMock('/tests/admin', {
  tests: [
    { id: 'test-1', name: 'React Certification', category: 'React', questions: 40, timeLimit: 35, passThreshold: 70, fee: 199, status: 'Active', results: 84 },
    { id: 'test-2', name: 'SEO Writing Screening', category: 'SEO', questions: 30, timeLimit: 25, passThreshold: 68, fee: 99, status: 'Active', results: 61 },
  ],
  questions: [{ id: 'q1', text: 'Which hook memoizes a computed value?', options: ['useMemo', 'useRef', 'useEffect', 'useState'], correct: 'A', explanation: 'useMemo memoizes derived values.' }],
  results: [{ id: 'tr-1', worker: 'Arjun Kumar', attemptDate: subDays(new Date(), 10).toISOString(), score: 86, passed: true, timeTaken: '28m' }],
})

export const getAdminAutomations = () => getOrMock('/automations', {
  rules: [
    { id: 'rule-1', name: 'Payment reminder', trigger: 'Milestone due in 3 days', lastRun: subDays(new Date(), 1).toISOString(), runCount: 42, status: 'Active' },
    { id: 'rule-2', name: 'Worker re-engagement', trigger: 'Worker inactive 30 days', lastRun: subDays(new Date(), 3).toISOString(), runCount: 18, status: 'Active' },
  ],
  templates: ['Auto-approve workers', 'Job matching notifications', 'Application follow-up reminder', 'Interview scheduling nudge', 'Payment reminder', 'Worker re-engagement', 'Project completion flow'].map((name, index) => ({ id: `tpl-${index}`, name, description: `${name} automation template.` })),
  runs: [{ id: 'run-1', triggeredAt: subDays(new Date(), 1).toISOString(), actor: 'System', outcome: 'Success', error: '' }],
})

export const getAdminLogs = () => getOrMock('/admin/audit-logs', [
  { id: 'log-1', timestamp: new Date().toISOString(), actor: 'Admin · Demo', actionType: 'Update', description: 'Changed worker verification status', affectedRecord: '/admin/workers/w-2', ip: '127.0.0.1' },
  { id: 'log-2', timestamp: subDays(new Date(), 1).toISOString(), actor: 'System', actionType: 'Login', description: 'Admin login succeeded', affectedRecord: '/admin/dashboard', ip: '127.0.0.1' },
])

export const getAdminSupport = () => getOrMock('/support/admin', [
  { id: 'sup-1', ticketNo: 'SUP-1042', requester: 'Maya Reynolds', type: 'Client', subject: 'Milestone invoice clarification', category: 'Payment', status: 'Open' as SupportStatus, priority: 'High', lastUpdated: subDays(new Date(), 1).toISOString(), messages: [{ sender: 'Client', body: 'Can you confirm the next invoice scope?', timestamp: subDays(new Date(), 1).toISOString() }] },
  { id: 'sup-2', ticketNo: 'SUP-1038', requester: 'Neha Verma', type: 'Worker', subject: 'Payout schedule question', category: 'Payment', status: 'In Progress' as SupportStatus, priority: 'Normal', lastUpdated: subDays(new Date(), 2).toISOString(), messages: [{ sender: 'Worker', body: 'When will the held payout release?', timestamp: subDays(new Date(), 2).toISOString() }] },
])

export const getAdminNotifications = () => getOrMock('/notifications/admin', {
  history: [
    { id: 'nt-1', title: 'June payout update', audience: 'All workers', sentAt: subDays(new Date(), 2).toISOString(), delivered: 214, opened: 156 },
    { id: 'nt-2', title: 'Client payment reminder', audience: 'Clients with outstanding invoices', sentAt: subDays(new Date(), 4).toISOString(), delivered: 9, opened: 7 },
  ],
})

export const getAdminSettings = () => getOrMock('/admin/settings', {
  skills: ['React', 'Python', 'SEO', 'Design', 'Writing'],
  payment: { defaultMargin: 33, methods: ['Stripe', 'Wise', 'PayPal', 'UPI', 'NEFT'], currency: 'USD/INR' },
  templates: ['Welcome worker', 'Verification approved', 'Payment reminder', 'Project complete'],
  admins: [{ id: 'adm-1', name: 'Admin User', email: 'admin@bridgr.example', permission: 'Owner' }],
})

export const adminPostAction = (path: string, payload: unknown = {}) => postOrMock(path, payload, { ok: true })

export const getWorkers = getAdminWorkers
export const getWorkerById = getAdminWorker
export const approveWorker = (id: string, notes?: string) => postOrMock(`/admin/workers/${id}/approve`, { notes }, { ok: true })
export const rejectWorker = (id: string, reason: string) => postOrMock(`/admin/workers/${id}/reject`, { reason }, { ok: true })
export const flagWorker = (id: string, reason?: string, suspend?: boolean) => postOrMock(`/admin/workers/${id}/flag`, { reason, suspend }, { ok: true })

export const getClients = getAdminClients
export const getClientById = async (id: string) => toAdminClient(await getOrMock(`/admin/clients/${id}`, mockAdminClients.find((client) => client.id === id) || mockAdminClients[0]))

export const getClientJobsInbox = getAdminJobInbox
export const getClientJobById = async (id: string) => toInboxItem(await getOrMock(`/admin/client-jobs/${id}`, mockInbox.find((job) => job.id === id) || mockInbox[0]))
export const createJobListingFromClientJob = (payload: JobListingCreationPayload) => postOrMock('/admin/job-listings', {
  clientJobId: payload.sourceClientJobId,
  title: payload.title,
  publicDescription: payload.description,
  category: payload.requiredSkills[0] ?? 'general',
  requiredSkills: payload.requiredSkills,
  workerBudgetAmount: payload.workerBudget,
  workerBudgetCurrency: 'INR',
  openings: payload.teamSize,
  applicationDeadline: payload.deadline,
  visibility: payload.visibility === 'Skills-filtered' ? 'skills_filtered' : payload.visibility === 'Invite-only' ? 'invite_only' : 'all_verified',
}, { id: 'jl-new', status: 'Draft' })
export const publishJobListing = (id: string) => postOrMock(`/admin/job-listings/${id}/publish`, {}, { ok: true })
export const getJobListings = getAdminListings

export const getApplications = (filters?: Record<string, unknown>) => {
  const applications: AdminApplication[] = mockAdminWorkers.flatMap((worker) =>
    worker.applications.map((application) => ({
      id: application.id,
      workerId: worker.id,
      workerName: worker.fullName,
      jobTitle: application.jobTitle,
      status: application.status,
      appliedDate: application.date,
      outcome: application.outcome,
    }))
  )
  return getOrMock('/admin/applications', applications, filters)
}
export const updateApplicationStatus = (id: string, status: string) => postOrMock(`/admin/applications/${id}/status`, { status }, { ok: true })

export const createProject = (payload: unknown) => postOrMock('/admin/projects', payload, { id: 'ap-new', status: 'Active' })
export const getProjects = getAdminProjects
export const getProjectById = getAdminProject
export const addProjectMember = (projectId: string, workerId: string) => postOrMock(`/admin/projects/${projectId}/members`, { workerId }, { ok: true })
export const removeProjectMember = (projectId: string, memberId: string) => {
  try {
    return apiClient.delete(`/admin/projects/${projectId}/members/${memberId}`).then((r) => r.data)
  } catch {
    return Promise.resolve({ ok: true })
  }
}

export const getPayments = getAdminPayments
export const markClientPaymentReceived = (payload: PaymentMarkingPayload) => postOrMock('/admin/payments/client-received', payload, { ok: true })
export const markWorkerPayoutPaid = (payload: PaymentMarkingPayload) => postOrMock('/admin/payments/worker-payout', payload, { ok: true })
export const getMarginReport = getAdminMarginReport
export const getAuditLogs = async (filters?: Record<string, unknown>) => pageItems<any>(await getOrMock('/admin/audit-logs', [
  { id: 'log-1', timestamp: new Date().toISOString(), actor: 'Admin Demo', actionType: 'Update', description: 'Changed worker verification status', affectedRecord: '/admin/workers/w-2', ip: '127.0.0.1' },
  { id: 'log-2', timestamp: subDays(new Date(), 1).toISOString(), actor: 'System', actionType: 'Login', description: 'Admin login succeeded', affectedRecord: '/admin/dashboard', ip: '127.0.0.1' },
], filters)).map(toAuditLog)
