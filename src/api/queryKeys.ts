import type { JobSearchParams } from './jobs'

export const authKeys = {
  root: ['auth'] as const,
  me: () => ['auth', 'me'] as const,
}

export const workerKeys = {
  root: ['worker'] as const,
  dashboard: () => ['worker', 'dashboard'] as const,
  stats: (workerId = 'me') => ['worker', workerId, 'stats'] as const,
  profile: (workerId = 'me') => ['worker', workerId, 'profile'] as const,
  availableJobs: (params?: unknown) => ['worker', 'jobs', 'available', params] as const,
  job: (id: string) => ['worker', 'jobs', id] as const,
  applications: (params?: unknown) => ['worker', 'applications', params] as const,
  projects: (params?: unknown) => ['worker', 'projects', params] as const,
  project: (id: string) => ['worker', 'project', id] as const,
  channels: (id: string) => ['worker', 'project', id, 'channels'] as const,
  tasks: (id: string) => ['worker', 'project', id, 'tasks'] as const,
  tests: () => ['worker', 'tests'] as const,
  certifications: () => ['worker', 'certifications'] as const,
  payments: (workerId = 'me') => ['worker', workerId, 'payments'] as const,
  referrals: () => ['worker', 'referrals'] as const,
  notifications: () => ['worker', 'notifications'] as const,
}

export const clientKeys = {
  root: ['client'] as const,
  dashboard: () => ['client', 'dashboard'] as const,
  jobs: (filters?: unknown) => ['client', 'jobs', filters] as const,
  job: (id: string) => ['client', 'jobs', id] as const,
  payments: (filters?: unknown) => ['client', 'payments', filters] as const,
  profile: () => ['client', 'profile'] as const,
  tickets: () => ['client', 'tickets'] as const,
}

export const adminKeys = {
  root: ['admin'] as const,
  dashboard: () => ['admin', 'dashboard'] as const,
  workers: (filters?: unknown) => ['admin', 'workers', filters] as const,
  worker: (id: string) => ['admin', 'worker', id] as const,
  verify: () => ['admin', 'verify'] as const,
  clients: (filters?: unknown) => ['admin', 'clients', filters] as const,
  client: (id: string) => ['admin', 'clients', id] as const,
  inbox: (filters?: unknown) => ['admin', 'jobs', 'inbox', filters] as const,
  inboxJob: (id: string) => ['admin', 'jobs', 'inbox', id] as const,
  listings: (filters?: unknown) => ['admin', 'jobs', filters] as const,
  applications: (filters?: unknown) => ['admin', 'applications', filters] as const,
  projects: (filters?: unknown) => ['admin', 'projects', filters] as const,
  project: (id: string) => ['admin', 'project', id] as const,
  projectMessages: (id: string) => ['admin', 'project', id, 'messages'] as const,
  projectTasks: (id: string) => ['admin', 'project', id, 'tasks'] as const,
  payments: (filters?: unknown) => ['admin', 'payments', filters] as const,
  marginReport: () => ['admin', 'payments', 'margin'] as const,
  analytics: () => ['admin', 'analytics'] as const,
  referrals: () => ['admin', 'referrals'] as const,
  tests: () => ['admin', 'tests'] as const,
  automations: () => ['admin', 'automations'] as const,
  logs: (filters?: unknown) => ['admin', 'logs', filters] as const,
  support: () => ['admin', 'support'] as const,
  notifications: () => ['admin', 'notifications'] as const,
  settings: () => ['admin', 'settings'] as const,
}

export const jobKeys = {
  root: ['jobs'] as const,
  list: (params: JobSearchParams) => ['jobs', params] as const,
  detail: (id: string) => ['jobs', id] as const,
}
