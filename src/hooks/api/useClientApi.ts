import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiStaleTimes } from '../../api/client'
import { createSupportTicket, getClientDashboard, getClientJobById, getClientJobs, getClientPayments, getClientProfile, submitClientJob, updateClientProfile, type ClientProfile } from '../../api/clientPortal'
import { clientKeys } from '../../api/queryKeys'
import type { ClientJobSubmissionPayload } from '../../api/schemas'

export const useClientDashboard = () => useQuery({
  queryKey: clientKeys.dashboard(),
  queryFn: getClientDashboard,
  staleTime: apiStaleTimes.live,
})

export const useClientJobs = () => useQuery({
  queryKey: clientKeys.jobs(),
  queryFn: getClientJobs,
  staleTime: apiStaleTimes.standard,
})

export const useClientJob = (id: string) => useQuery({
  queryKey: clientKeys.job(id),
  queryFn: () => getClientJobById(id),
  enabled: Boolean(id),
})

export const useSubmitClientJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientJobSubmissionPayload) => submitClientJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: clientKeys.dashboard() })
    },
  })
}

export const useClientPayments = () => useQuery({
  queryKey: clientKeys.payments(),
  queryFn: getClientPayments,
  staleTime: apiStaleTimes.standard,
})

export const useClientProfile = () => useQuery({
  queryKey: clientKeys.profile(),
  queryFn: getClientProfile,
  staleTime: apiStaleTimes.long,
})

export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ClientProfile>) => updateClientProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.profile() }),
  })
}

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.tickets() }),
  })
}
