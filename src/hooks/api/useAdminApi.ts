import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiStaleTimes } from '../../api/client'
import { addProjectMember, approveWorker, createJobListingFromClientJob, createProject, flagWorker, getAdminDashboard, getApplications, getAuditLogs, getClientById, getClientJobById, getClientJobsInbox, getClients, getJobListings, getMarginReport, getPayments, getProjectById, getProjects, getWorkerById, getWorkers, markClientPaymentReceived, markWorkerPayoutPaid, publishJobListing, rejectWorker, removeProjectMember, updateApplicationStatus, type WorkerStatus } from '../../api/admin'
import { adminKeys } from '../../api/queryKeys'
import type { JobListingCreationPayload, PaymentMarkingPayload } from '../../api/schemas'

export const useAdminDashboard = () => useQuery({
  queryKey: adminKeys.dashboard(),
  queryFn: getAdminDashboard,
  staleTime: apiStaleTimes.live,
})

export const useAdminWorkers = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.workers(filters),
  queryFn: () => getWorkers(filters),
  staleTime: apiStaleTimes.standard,
})

export const useAdminWorker = (id: string) => useQuery({
  queryKey: adminKeys.worker(id),
  queryFn: () => getWorkerById(id),
  enabled: Boolean(id),
})

export const useWorkerVerificationActions = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.root })

  return {
    approveWorker: useMutation({ mutationFn: (id: string) => approveWorker(id), onSuccess: invalidate }),
    rejectWorker: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectWorker(id, reason), onSuccess: invalidate }),
    flagWorker: useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => flagWorker(id, reason), onSuccess: invalidate }),
  }
}

export const useAdminClients = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.clients(filters),
  queryFn: () => getClients(filters),
  staleTime: apiStaleTimes.standard,
})

export const useAdminClient = (id: string) => useQuery({
  queryKey: adminKeys.client(id),
  queryFn: () => getClientById(id),
  enabled: Boolean(id),
})

export const useClientJobsInbox = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.inbox(filters),
  queryFn: () => getClientJobsInbox(filters),
  staleTime: apiStaleTimes.live,
})

export const useAdminClientJob = (id: string) => useQuery({
  queryKey: adminKeys.inboxJob(id),
  queryFn: () => getClientJobById(id),
  enabled: Boolean(id),
})

export const useCreateJobListing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: JobListingCreationPayload) => createJobListingFromClientJob(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.listings() }),
  })
}

export const usePublishJobListing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: publishJobListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.listings() }),
  })
}

export const useAdminJobListings = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.listings(filters),
  queryFn: () => getJobListings(filters),
  staleTime: apiStaleTimes.standard,
})

export const useAdminApplications = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.applications(filters),
  queryFn: () => getApplications(filters),
  staleTime: apiStaleTimes.live,
})

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkerStatus }) => updateApplicationStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.applications() }),
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.projects() }),
  })
}

export const useAdminProjects = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.projects(filters),
  queryFn: () => getProjects(filters),
  staleTime: apiStaleTimes.standard,
})

export const useAdminProject = (id: string) => useQuery({
  queryKey: adminKeys.project(id),
  queryFn: () => getProjectById(id),
  enabled: Boolean(id),
})

export const useProjectMemberActions = (projectId: string) => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.project(projectId) })

  return {
    addMember: useMutation({ mutationFn: (workerId: string) => addProjectMember(projectId, workerId), onSuccess: invalidate }),
    removeMember: useMutation({ mutationFn: (workerId: string) => removeProjectMember(projectId, workerId), onSuccess: invalidate }),
  }
}

export const useAdminPayments = () => useQuery({
  queryKey: adminKeys.payments(),
  queryFn: getPayments,
  staleTime: apiStaleTimes.live,
})

export const usePaymentMarkingActions = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.payments() })

  return {
    markClientPaymentReceived: useMutation({ mutationFn: (payload: PaymentMarkingPayload) => markClientPaymentReceived(payload), onSuccess: invalidate }),
    markWorkerPayoutPaid: useMutation({ mutationFn: (payload: PaymentMarkingPayload) => markWorkerPayoutPaid(payload), onSuccess: invalidate }),
  }
}

export const useMarginReport = () => useQuery({
  queryKey: adminKeys.marginReport(),
  queryFn: getMarginReport,
  staleTime: apiStaleTimes.standard,
})

export const useAuditLogs = (filters?: Record<string, unknown>) => useQuery({
  queryKey: adminKeys.logs(filters),
  queryFn: () => getAuditLogs(filters),
  staleTime: apiStaleTimes.live,
})
