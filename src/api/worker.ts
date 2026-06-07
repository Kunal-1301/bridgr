import { addDays, subMonths } from 'date-fns'
import { apiClient, dedupedGet, isApiMockEnabled } from './client'
import { asIso, pageItems, pageResponse, titleCase, type PageResponse } from './normalize'
import type { JobSearchParams, PaginatedJobs } from './jobs'

export type Tier = 'newcomer' | 'verified' | 'certified' | 'pro' | 'elite'
export type PaymentType = 'Fixed' | 'Milestone' | 'Hourly'
export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected'
export type ProjectStatus = 'Active' | 'Under Review' | 'Completed'
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done'

export interface WorkerStats {
  activeProjects: number
  pendingEarnings: number
  unreadMessages: number
  tier: Tier
  earnings: { month: string; amount: number }[]
  messages: { id: string; senderInitials: string; preview: string; timestamp: string }[]
}

export interface Job {
  id: string
  title: string
  skills: string[]
  budget: number
  paymentType: PaymentType
  teamSize: number
  deadline: string
  duration: string
  description: string
  deliverables: string[]
  applicationsReceived: number
  alreadyApplied?: boolean
  visibility: 'Worker pool'
}

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  status: ApplicationStatus
  appliedDate: string
  note: string
  jobSummary: string
  coverNote: string
  adminNotes?: string
  history: { status: string; date: string }[]
}

export interface Project {
  id: string
  title: string
  status: ProjectStatus
  deadline: string
  team: { initials: string; role: string; online: boolean }[]
  progress: number
  channels?: string[]
  meetingLink?: string
}

export interface Message {
  id: string
  senderInitials: string
  senderName: string
  timestamp: string
  body: string
  attachments?: { name: string; size: string }[]
}

export interface Task {
  id: string
  title: string
  assigneeInitials: string
  dueDate: string
  status: TaskStatus
}

export interface WorkerTest {
  id: string
  name: string
  category: string
  questions: number
  timeLimit: number
  passingScore: number
  fee: number
  cooldownDays?: number
}

export interface Certification {
  id: string
  name: string
  issuedDate: string
  expiry?: string
  score: number
  downloadUrl: string
}

export interface PaymentRecord {
  id: string
  project: string
  milestone: string
  amount: number
  status: 'Released' | 'Pending'
  date: string
}

export interface WorkerPayments {
  totalEarned: number
  pendingPayout: number
  thisMonth: number
  earnings: PaymentRecord[]
  breakdown: { project: string; milestones: PaymentRecord[] }[]
}

export interface ReferralStats {
  link: string
  clicks: number
  signups: number
  approved: number
  earnings: number
  conversionCount: number
  referredCount: number
  leaderboard: { rank: number; name: string; approved: number; earnings: number }[]
  history: { id: string; worker: string; status: string; amount: number; date: string }[]
}

export interface WorkerProfile {
  id: string
  fullName: string
  email: string
  phone: string
  city: string
  bio: string
  skills: string[]
  experienceLevel: string
  rateMin: number
  rateMax: number
  portfolio: { id: string; url: string; description: string }[]
  documents: { type: string; filename: string; status: string }[]
  certifications: Certification[]
  tier: Tier
  trust: { label: string; score: number; max: number }[]
}

export interface NotificationItem {
  id: string
  type: 'Jobs' | 'Payments' | 'System'
  message: string
  timestamp: string
  unread: boolean
}

export { workerKeys } from './queryKeys'

const months = Array.from({ length: 6 }).map((_, index) => {
  const date = subMonths(new Date(), 5 - index)
  return date.toLocaleString('en-US', { month: 'short' })
})

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'React Dashboard Build for Operations Team',
    skills: ['React', 'TypeScript', 'Charts'],
    budget: 68000,
    paymentType: 'Milestone',
    teamSize: 2,
    deadline: addDays(new Date(), 12).toISOString(),
    duration: '3 weeks',
    description: 'Build a private operations dashboard with authenticated views, status tables, and reporting charts. The scope has been rewritten for worker delivery and excludes all client identifiers.',
    deliverables: ['Responsive dashboard shell', 'Role-specific data tables', 'Analytics chart module', 'QA handoff notes'],
    applicationsReceived: 14,
    alreadyApplied: false,
    visibility: 'Worker pool',
  },
  {
    id: 'job-2',
    title: 'SEO Content Production Sprint',
    skills: ['Writing', 'SEO', 'Research'],
    budget: 42000,
    paymentType: 'Fixed',
    teamSize: 3,
    deadline: addDays(new Date(), 8).toISOString(),
    duration: '10 days',
    description: 'Produce a batch of optimized long-form content from admin-provided outlines and keyword briefs.',
    deliverables: ['12 content drafts', 'Meta title set', 'Internal linking notes'],
    applicationsReceived: 21,
    alreadyApplied: true,
    visibility: 'Worker pool',
  },
  {
    id: 'job-3',
    title: 'Python Data Cleanup Automation',
    skills: ['Python', 'Pandas', 'Automation'],
    budget: 55000,
    paymentType: 'Hourly',
    teamSize: 1,
    deadline: addDays(new Date(), 18).toISOString(),
    duration: '2 weeks',
    description: 'Create scripts to normalize messy spreadsheet inputs, generate audit reports, and document repeatable usage.',
    deliverables: ['Data cleaning scripts', 'Validation report', 'Setup README'],
    applicationsReceived: 9,
    visibility: 'Worker pool',
  },
]

export const mockStats: WorkerStats = {
  activeProjects: 3,
  pendingEarnings: 32500,
  unreadMessages: 7,
  tier: 'certified',
  earnings: months.map((month, index) => ({ month, amount: [18000, 22000, 28500, 31000, 40500, 46000][index] })),
  messages: [
    { id: 'm1', senderInitials: 'AD', preview: 'Please review the milestone notes before EOD.', timestamp: new Date().toISOString() },
    { id: 'm2', senderInitials: 'PM', preview: 'New files were added to the deliverables channel.', timestamp: addDays(new Date(), -1).toISOString() },
    { id: 'm3', senderInitials: 'QA', preview: 'The first review pass is complete.', timestamp: addDays(new Date(), -2).toISOString() },
  ],
}

export const mockApplications: Application[] = [
  { id: 'app-1', jobId: 'job-1', jobTitle: mockJobs[0].title, status: 'Applied', appliedDate: addDays(new Date(), -3).toISOString(), note: 'Awaiting admin review', jobSummary: mockJobs[0].description, coverNote: 'I have shipped dashboards with React and charting libraries.', adminNotes: 'Strong frontend fit.', history: [{ status: 'Applied', date: addDays(new Date(), -3).toISOString() }] },
  { id: 'app-2', jobId: 'job-3', jobTitle: mockJobs[2].title, status: 'Shortlisted', appliedDate: addDays(new Date(), -5).toISOString(), note: 'Shortlisted for technical review', jobSummary: mockJobs[2].description, coverNote: 'I can automate the cleanup flow with Pandas.', adminNotes: 'Ask for code sample.', history: [{ status: 'Applied', date: addDays(new Date(), -5).toISOString() }, { status: 'Shortlisted', date: addDays(new Date(), -2).toISOString() }] },
  { id: 'app-3', jobId: 'job-2', jobTitle: mockJobs[1].title, status: 'Interview Scheduled', appliedDate: addDays(new Date(), -7).toISOString(), note: 'Intro call scheduled', jobSummary: mockJobs[1].description, coverNote: 'SEO production work is my primary niche.', history: [{ status: 'Applied', date: addDays(new Date(), -7).toISOString() }, { status: 'Interview Scheduled', date: addDays(new Date(), -1).toISOString() }] },
]

export const mockProjects: Project[] = [
  { id: 'proj-1', title: 'Ops Dashboard Delivery', status: 'Active', deadline: addDays(new Date(), 16).toISOString(), team: [{ initials: 'AK', role: 'Frontend', online: true }, { initials: 'RS', role: 'QA', online: false }, { initials: 'AD', role: 'Admin', online: true }], progress: 62, channels: ['general', 'deliverables', 'updates', 'frontend'], meetingLink: 'https://meet.example.com/bridgr-sync' },
  { id: 'proj-2', title: 'Content Sprint Batch A', status: 'Under Review', deadline: addDays(new Date(), 4).toISOString(), team: [{ initials: 'NV', role: 'Writer', online: true }, { initials: 'AD', role: 'Admin', online: true }], progress: 88, channels: ['general', 'deliverables', 'updates'] },
  { id: 'proj-3', title: 'Automation Scripts V1', status: 'Completed', deadline: addDays(new Date(), -8).toISOString(), team: [{ initials: 'PK', role: 'Python', online: false }, { initials: 'AD', role: 'Admin', online: true }], progress: 100, channels: ['general', 'deliverables', 'updates'] },
]

export const mockMessages: Message[] = [
  { id: 'chat-1', senderInitials: 'AD', senderName: 'Admin Lead', timestamp: addDays(new Date(), -1).toISOString(), body: 'Please keep all delivery updates in this workspace. The next milestone is due Friday.', attachments: [{ name: 'milestone-brief.pdf', size: '420 KB' }] },
  { id: 'chat-2', senderInitials: 'AK', senderName: 'Arjun K', timestamp: new Date().toISOString(), body: 'Uploaded the revised component map and added notes for QA.' },
]

export const mockTasks: Task[] = [
  { id: 't1', title: 'Finalize dashboard shell', assigneeInitials: 'AK', dueDate: addDays(new Date(), 2).toISOString(), status: 'In Progress' },
  { id: 't2', title: 'Review deliverable checklist', assigneeInitials: 'RS', dueDate: addDays(new Date(), 3).toISOString(), status: 'To Do' },
  { id: 't3', title: 'Prepare admin demo notes', assigneeInitials: 'AD', dueDate: addDays(new Date(), 5).toISOString(), status: 'Review' },
  { id: 't4', title: 'Archive sprint files', assigneeInitials: 'AK', dueDate: addDays(new Date(), 6).toISOString(), status: 'Done' },
]

export const mockTests: WorkerTest[] = [
  { id: 'test-1', name: 'React Practical', category: 'Frontend', questions: 20, timeLimit: 30, passingScore: 75, fee: 0 },
  { id: 'test-2', name: 'Python Data Automation', category: 'Backend', questions: 25, timeLimit: 40, passingScore: 70, fee: 99 },
  { id: 'test-3', name: 'SEO Writing', category: 'Content', questions: 18, timeLimit: 25, passingScore: 72, fee: 0, cooldownDays: 4 },
]

export const mockCertifications: Certification[] = [
  { id: 'cert-1', name: 'React Certified Worker', issuedDate: addDays(new Date(), -44).toISOString(), expiry: addDays(new Date(), 320).toISOString(), score: 86, downloadUrl: '#' },
  { id: 'cert-2', name: 'SEO Writing Certified', issuedDate: addDays(new Date(), -90).toISOString(), score: 81, downloadUrl: '#' },
]

const records: PaymentRecord[] = [
  { id: 'pay-1', project: 'Ops Dashboard Delivery', milestone: 'Milestone 1', amount: 18000, status: 'Released', date: addDays(new Date(), -24).toISOString() },
  { id: 'pay-2', project: 'Ops Dashboard Delivery', milestone: 'Milestone 2', amount: 22000, status: 'Pending', date: addDays(new Date(), -3).toISOString() },
  { id: 'pay-3', project: 'Content Sprint Batch A', milestone: 'Final Batch', amount: 14500, status: 'Released', date: addDays(new Date(), -12).toISOString() },
]

export const mockPayments: WorkerPayments = {
  totalEarned: 186000,
  pendingPayout: 22000,
  thisMonth: 36500,
  earnings: records,
  breakdown: [
    { project: 'Ops Dashboard Delivery', milestones: records.filter((record) => record.project === 'Ops Dashboard Delivery') },
    { project: 'Content Sprint Batch A', milestones: records.filter((record) => record.project === 'Content Sprint Batch A') },
  ],
}

export const mockReferrals: ReferralStats = {
  link: 'https://bridgr.app/r/AK204',
  clicks: 182,
  signups: 31,
  approved: 12,
  earnings: 18500,
  referredCount: 31,
  conversionCount: 12,
  leaderboard: [
    { rank: 1, name: 'Worker #104', approved: 18, earnings: 27000 },
    { rank: 2, name: 'Worker #088', approved: 14, earnings: 21000 },
    { rank: 3, name: 'You', approved: 12, earnings: 18500 },
    { rank: 4, name: 'Worker #211', approved: 9, earnings: 13500 },
    { rank: 5, name: 'Worker #145', approved: 7, earnings: 10500 },
  ],
  history: [
    { id: 'ref-1', worker: 'Worker #331', status: 'Approved', amount: 2500, date: addDays(new Date(), -4).toISOString() },
    { id: 'ref-2', worker: 'Worker #332', status: 'Pending', amount: 0, date: addDays(new Date(), -9).toISOString() },
  ],
}

export const mockProfile: WorkerProfile = {
  id: 'worker-demo',
  fullName: 'Arjun Kumar',
  email: 'worker@bridgr.com',
  phone: '+91 98765 43210',
  city: 'Bengaluru',
  bio: 'Frontend engineer focused on React dashboards, structured delivery, and clean handoffs.',
  skills: ['React', 'TypeScript', 'Charts', 'QA'],
  experienceLevel: 'Senior',
  rateMin: 1200,
  rateMax: 2200,
  portfolio: [{ id: 'pf-1', url: 'https://portfolio.example.com', description: 'Dashboard and reporting portfolio' }],
  documents: [{ type: 'Resume', filename: 'arjun-resume.pdf', status: 'Approved' }, { type: 'ID Proof', filename: 'a*********.pdf', status: 'Approved' }],
  certifications: mockCertifications,
  tier: 'certified',
  trust: [
    { label: 'ID Verified', score: 20, max: 20 },
    { label: 'Projects Completed', score: 22, max: 30 },
    { label: 'No Disputes', score: 15, max: 15 },
    { label: 'Punctuality', score: 8, max: 10 },
    { label: 'Certifications', score: 12, max: 15 },
    { label: 'Admin Rating', score: 8, max: 10 },
  ],
}

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', type: 'Jobs', message: 'A new React job matches your profile.', timestamp: new Date().toISOString(), unread: true },
  { id: 'n2', type: 'Payments', message: 'Milestone payout moved to pending.', timestamp: addDays(new Date(), -1).toISOString(), unread: true },
  { id: 'n3', type: 'System', message: 'Your ID proof was approved by admin.', timestamp: addDays(new Date(), -5).toISOString(), unread: false },
]

async function getOrMock<T>(path: string, mock: T, params?: Record<string, unknown>) {
  try {
    return await dedupedGet<T>(path, { params })
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return mock
  }
}

const toWorkerDashboard = (data: any): WorkerStats => ({
  activeProjects: data?.activeProjects ?? data?.activeProjectsCount ?? 0,
  pendingEarnings: data?.pendingEarnings ?? data?.pendingPaymentsAmount ?? 0,
  unreadMessages: data?.unreadMessages ?? pageItems(data?.recentNotifications).filter((item: any) => !item.isRead).length,
  tier: (data?.tier ?? 'newcomer') as Tier,
  earnings: data?.earnings ?? [],
  messages: (data?.messages ?? data?.recentNotifications ?? []).map((item: any) => ({
    id: String(item.id),
    senderInitials: item.senderInitials ?? 'BR',
    preview: item.preview ?? item.body ?? item.title ?? '',
    timestamp: asIso(item.timestamp ?? item.createdAt),
  })),
})

const toJob = (item: any): Job => ({
  id: String(item.id),
  title: item.title ?? 'Untitled job',
  skills: item.skills ?? item.requiredSkills ?? [],
  budget: item.budget ?? item.workerBudgetAmount ?? 0,
  paymentType: item.paymentType ?? 'Fixed',
  teamSize: item.teamSize ?? item.openings ?? 1,
  deadline: asIso(item.deadline ?? item.applicationDeadline),
  duration: item.duration ?? item.estimatedDuration ?? 'Flexible',
  description: item.description ?? item.publicDescription ?? '',
  deliverables: item.deliverables ?? [],
  applicationsReceived: item.applicationsReceived ?? item.applications ?? 0,
  alreadyApplied: item.alreadyApplied ?? false,
  visibility: 'Worker pool',
})

const toApplication = (item: any): Application => ({
  id: String(item.id),
  jobId: String(item.jobId ?? item.listingId ?? ''),
  jobTitle: item.jobTitle ?? item.listingTitle ?? 'Untitled listing',
  status: titleCase(item.status, 'Applied') as ApplicationStatus,
  appliedDate: asIso(item.appliedDate ?? item.appliedAt),
  note: item.note ?? titleCase(item.status, 'Applied'),
  jobSummary: item.jobSummary ?? '',
  coverNote: item.coverNote ?? item.coverLetter ?? '',
  adminNotes: item.adminNotes,
  history: item.history ?? [{ status: titleCase(item.status, 'Applied'), date: asIso(item.appliedAt) }],
})

const toProject = (item: any): Project => ({
  id: String(item.id),
  title: item.title ?? 'Untitled project',
  status: titleCase(item.status, 'Active') as ProjectStatus,
  deadline: asIso(item.deadline ?? item.dueDate),
  team: item.team ?? [],
  progress: item.progress ?? (String(item.status).toLowerCase() === 'completed' ? 100 : 35),
  channels: item.channels?.map((channel: any) => channel.name ?? channel) ?? [],
  meetingLink: item.meetingLink,
})

const toMessage = (item: any): Message => ({
  id: String(item.id),
  senderInitials: item.senderInitials ?? 'BR',
  senderName: item.senderName ?? 'Bridgr',
  timestamp: asIso(item.timestamp ?? item.createdAt),
  body: item.body ?? item.content ?? '',
  attachments: item.attachments ?? [],
})

const toPaymentItem = (item: any): PaymentRecord => ({
  id: String(item.id),
  project: item.project ?? item.projectId ?? 'Project payment',
  milestone: item.milestone ?? item.milestoneId ?? 'Payout',
  amount: Number(item.amount ?? 0),
  status: String(item.status ?? '').toLowerCase() === 'paid' ? 'Released' : 'Pending',
  date: asIso(item.date ?? item.createdAt),
})

const toWorkerPayments = (data: any): WorkerPayments => {
  const source = pageItems<any>(data)
  if (!source.length && data?.earnings) return data as WorkerPayments
  const earnings = source.map(toPaymentItem)
  const totalEarned = earnings.filter((item) => item.status === 'Released').reduce((sum, item) => sum + item.amount, 0)
  const pendingPayout = earnings.filter((item) => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0)
  return {
    totalEarned,
    pendingPayout,
    thisMonth: earnings.reduce((sum, item) => sum + item.amount, 0),
    earnings,
    breakdown: Object.values(
      earnings.reduce<Record<string, { project: string; milestones: PaymentRecord[] }>>((groups, item) => {
        groups[item.project] ??= { project: item.project, milestones: [] }
        groups[item.project].milestones.push(item)
        return groups
      }, {})
    ),
  }
}

const toWorkerProfile = (data: any): WorkerProfile => ({
  id: String(data.id ?? data.profileId ?? 'me'),
  fullName: data.fullName ?? '',
  email: data.email ?? '',
  phone: data.phone ?? '',
  city: data.city ?? '',
  bio: data.bio ?? data.headline ?? '',
  skills: data.skills ?? [],
  experienceLevel: data.experienceLevel ?? '',
  rateMin: data.rateMin ?? data.hourlyRateMinInr ?? 0,
  rateMax: data.rateMax ?? data.hourlyRateMaxInr ?? 0,
  portfolio: data.portfolio ?? [],
  documents: data.documents ?? [],
  certifications: data.certifications ?? [],
  tier: (data.tier ?? 'newcomer') as Tier,
  trust: data.trust ?? [{ label: 'Trust score', score: data.trustScore ?? 0, max: 100 }],
})

const toNotification = (item: any): NotificationItem => ({
  id: String(item.id),
  type: titleCase(item.type ?? item.notificationType, 'System') as NotificationItem['type'],
  message: item.message ?? item.body ?? item.title ?? '',
  timestamp: asIso(item.timestamp ?? item.createdAt),
  unread: item.unread ?? !item.isRead,
})

async function postOrMock<T>(path: string, body: unknown, mock: T) {
  try {
    const response = await apiClient.post<T>(path, body)
    return response.data
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return mock
  }
}

export const getWorkerDashboard = async () => toWorkerDashboard(await getOrMock('/worker/dashboard', mockStats))
export const getWorkerStats = (_workerId?: string) => getWorkerDashboard()
export const getApplications = async (params?: { limit?: number; status?: string }) => pageItems<any>(await getOrMock('/worker/applications', params?.limit ? mockApplications.slice(0, params.limit) : mockApplications, params)).map(toApplication)
export const getProjects = async (params?: { limit?: number }) => pageItems<any>(await getOrMock('/worker/projects', params?.limit ? mockProjects.slice(0, params.limit) : mockProjects, params)).map(toProject)
export const getProject = async (id: string) => toProject(await getOrMock(`/worker/projects/${id}`, mockProjects.find((project) => project.id === id) || mockProjects[0]))
export const getProjectChannels = async (id: string) => {
  const project = await getOrMock<any>(`/worker/projects/${id}`, mockProjects.find((item) => item.id === id) || mockProjects[0])
  return (project.channels ?? ['general', 'deliverables', 'updates']).map((channel: any) => channel.name ?? channel)
}
export const getProjectMessages = async (id: string) => pageItems<any>(await getOrMock(`/worker/projects/${id}/messages`, mockMessages)).map(toMessage)
export const getProjectTasks = (id: string) => getOrMock('/tasks', mockTasks, { project_id: id })
export const getTests = () => getOrMock('/tests', mockTests)
export const startTestAttempt = (id: string) => postOrMock(`/tests/${id}/attempt`, {}, { attemptId: `attempt-${id}` })
export const submitTestAttempt = (id: string, attemptId: string, answers: Record<string, string>) => postOrMock(`/tests/${id}/attempt/${attemptId}/submit`, answers, { score: 82, passed: true })
export const getCertifications = () => getOrMock('/certifications', mockCertifications)
export const getPayments = async (_workerId?: string) => toWorkerPayments(await getOrMock('/worker/payments', mockPayments))
export const getReferralStats = () => getOrMock('/referrals/stats', mockReferrals)
export const getWorkerProfile = async (workerId = 'me') => toWorkerProfile(await getOrMock(workerId === 'me' ? '/worker/profile' : `/admin/workers/${workerId}`, mockProfile))
export const updateWorkerProfile = async (_workerId: string, payload: Partial<WorkerProfile>) => {
  try {
    const response = await apiClient.patch<WorkerProfile>('/worker/profile', payload)
    return response.data
  } catch {
    return { ...mockProfile, ...payload }
  }
}
export const getNotifications = async () => pageItems<any>(await getOrMock('/worker/notifications', mockNotifications)).map(toNotification)
export const markNotificationRead = async (id: string) => {
  const response = await apiClient.post(`/worker/notifications/${id}/read`)
  return toNotification(response.data)
}
export const changePassword = (payload: { currentPassword: string; newPassword: string }) => postOrMock('/auth/change-password', payload, { ok: true })
export const updatePreferences = (payload: unknown) => postOrMock('/workers/preferences', payload, { ok: true })
export const requestDeleteAccount = () => postOrMock('/workers/delete-request', {}, { ok: true })

export const uploadWorkerDocument = async (payload: FormData) => {
  try {
    const response = await apiClient.post<{ key: string; url?: string; status: string }>('/worker/documents/upload', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return { key: 'demo/document.pdf', status: 'Uploaded' }
  }
}

export const getAvailableJobs = async (params: JobSearchParams): Promise<PaginatedJobs> => {
  try {
    const data = await dedupedGet<PageResponse<any> | any[]>('/worker/jobs', {
      params: {
        page: params.page,
        search: params.search || undefined,
        skill: params.skills?.[0] || undefined,
        payment_type: params.payment_type || undefined,
        sort: params.sort || undefined,
      },
    })
    const page = pageResponse(data)
    return { ...page, jobs: page.items.map(toJob) }
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    const filtered = mockJobs
      .filter((job) => !params.search || job.title.toLowerCase().includes(params.search.toLowerCase()))
      .filter((job) => !params.payment_type || params.payment_type === 'All' || job.paymentType === params.payment_type)
      .filter((job) => !params.skills?.length || params.skills.every((skill) => job.skills.includes(skill)))

    return {
      jobs: filtered,
      total: filtered.length,
      page: params.page,
      pageSize: 20,
    }
  }
}

export const getJobById = (id: string) => getOrMock(`/worker/jobs/${id}`, mockJobs.find((job) => job.id === id) || mockJobs[0])
export const getJob = async (id: string) => toJob(await getJobById(id))
export const applyToJob = (id: string, payload: { coverNote: string }) => postOrMock(`/worker/jobs/${id}/apply`, { coverLetter: payload.coverNote }, { ok: true })
export const getWorkerApplications = getApplications
export const getWorkerProjects = getProjects
export const getWorkerProjectById = getProject
export const getWorkerPayments = (_workerId?: string) => getPayments()
export const getWorkerNotifications = getNotifications
