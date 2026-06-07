import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiStaleTimes } from '../../api/client'
import { applyToJob, getAvailableJobs, getJob, getWorkerApplications, getWorkerDashboard, getWorkerNotifications, getWorkerPayments, getWorkerProfile, getWorkerProjectById, getWorkerProjects, markNotificationRead, updateWorkerProfile, uploadWorkerDocument, type NotificationItem, type WorkerProfile } from '../../api/worker'
import { jobKeys, workerKeys } from '../../api/queryKeys'
import type { JobSearchParams } from '../../api/jobs'

export const useWorkerDashboard = () => useQuery({
  queryKey: workerKeys.dashboard(),
  queryFn: getWorkerDashboard,
  staleTime: apiStaleTimes.live,
})

export const useWorkerProfile = (workerId = 'me') => useQuery({
  queryKey: workerKeys.profile(workerId),
  queryFn: () => getWorkerProfile(workerId),
})

export const useUpdateWorkerProfile = (workerId = 'me') => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<WorkerProfile>) => updateWorkerProfile(workerId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workerKeys.profile(workerId) }),
  })
}

export const useUploadWorkerDocument = () => useMutation({ mutationFn: uploadWorkerDocument })

export const useAvailableJobs = (params: JobSearchParams) => useQuery({
  queryKey: jobKeys.list(params),
  queryFn: () => getAvailableJobs(params),
  staleTime: apiStaleTimes.long,
})

export const useWorkerJob = (id: string) => useQuery({
  queryKey: jobKeys.detail(id),
  queryFn: () => getJob(id),
  enabled: Boolean(id),
  staleTime: apiStaleTimes.long,
})

export const useApplyToJob = (jobId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { coverNote: string }) => applyToJob(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.applications() })
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export const useWorkerApplications = (params?: { limit?: number; status?: string }) => useQuery({
  queryKey: workerKeys.applications(params),
  queryFn: () => getWorkerApplications(params),
  staleTime: apiStaleTimes.live,
})

export const useWorkerProjects = (params?: { limit?: number }) => useQuery({
  queryKey: workerKeys.projects(params),
  queryFn: () => getWorkerProjects(params),
  staleTime: apiStaleTimes.live,
})

export const useWorkerProject = (id: string) => useQuery({
  queryKey: workerKeys.project(id),
  queryFn: () => getWorkerProjectById(id),
  enabled: Boolean(id),
})

export const useWorkerPayments = (workerId = 'me') => useQuery({
  queryKey: workerKeys.payments(workerId),
  queryFn: () => getWorkerPayments(workerId),
})

export const useWorkerNotifications = () => useQuery({
  queryKey: workerKeys.notifications(),
  queryFn: getWorkerNotifications,
  staleTime: apiStaleTimes.live,
})

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workerKeys.notifications() })
      const previous = queryClient.getQueryData<NotificationItem[]>(workerKeys.notifications())
      queryClient.setQueryData<NotificationItem[]>(workerKeys.notifications(), (items = []) =>
        items.map((item) => (item.id === id ? { ...item, unread: false } : item))
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(workerKeys.notifications(), context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: workerKeys.notifications() }),
  })
}
