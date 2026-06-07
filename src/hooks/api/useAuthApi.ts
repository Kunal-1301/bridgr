import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { forgotPassword, login, logout, me, refresh, registerWorker, resetPassword, verifyEmail } from '../../api/auth'
import { authKeys } from '../../api/queryKeys'
import type { LoginPayload, WorkerRegistrationPayload } from '../../api/schemas'

export const useMe = () => useQuery({ queryKey: authKeys.me(), queryFn: me })

export const useLogin = () => useMutation({ mutationFn: (payload: LoginPayload) => login(payload) })

export const useRefreshAuth = () => useMutation({ mutationFn: refresh })

export const useLogout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.removeQueries({ queryKey: authKeys.root }),
  })
}

export const useRegisterWorker = () => useMutation({
  mutationFn: (payload: WorkerRegistrationPayload) => registerWorker(payload),
})

export const useForgotPassword = () => useMutation({ mutationFn: forgotPassword })

export const useResetPassword = () => useMutation({ mutationFn: resetPassword })

export const useVerifyEmail = () => useMutation({ mutationFn: verifyEmail })
