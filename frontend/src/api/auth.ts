import { apiClient, isApiMockEnabled } from './client'
import { createDemoToken, createDemoUser, isDemoAuthEnabled } from './dummyAuth'
import type { LoginPayload, WorkerRegistrationPayload } from './schemas'
import type { User } from '../store/authStore'

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface MessageResponse {
  ok: boolean
  message?: string
}

const mockAuth = (payload: LoginPayload): AuthResponse => {
  const role = payload.role || 'worker'
  return {
    user: createDemoUser(payload.email, role),
    accessToken: createDemoToken(role),
  }
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    return response.data
  } catch (error) {
    if (!isDemoAuthEnabled()) throw error
    return mockAuth(payload)
  }
}

export const refresh = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/refresh')
  return response.data
}

export const logout = async (): Promise<MessageResponse> => {
  try {
    const response = await apiClient.post<MessageResponse>('/auth/logout')
    return response.data
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return { ok: true }
  }
}

export const me = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me')
  return response.data
}

export const registerWorker = async (payload: WorkerRegistrationPayload): Promise<MessageResponse> => {
  try {
    const response = await apiClient.post<MessageResponse>('/auth/register-worker', payload)
    return response.data
  } catch (error) {
    if (!isDemoAuthEnabled()) throw error
    return { ok: true, message: 'Demo worker registration accepted.' }
  }
}

export const forgotPassword = async (email: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/forgot-password', { email })
  return response.data
}

export const resetPassword = async (payload: { token: string; password: string }): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/reset-password', payload)
  return response.data
}

export const verifyEmail = async (token: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>(`/auth/verify-email/${token}`)
  return response.data
}
