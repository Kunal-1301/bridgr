import axios, { type AxiosRequestConfig } from 'axios'
import { useAuthStore, type User } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiStaleTimes = {
  live: 1000 * 30,
  standard: 1000 * 60 * 5,
  long: 1000 * 60 * 15,
  static: 1000 * 60 * 30,
} as const

export const isApiMockEnabled = () =>
  import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.VITE_ENABLE_API_MOCKS === 'true'

const inFlightGetRequests = new Map<string, Promise<unknown>>()

const stableStringify = (value: unknown): string => {
  if (!value || typeof value !== 'object') return JSON.stringify(value ?? null)
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined && entryValue !== '')
    .sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify(Object.fromEntries(entries))
}

export const dedupedGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const key = `${url}:${stableStringify(config?.params)}`
  const existing = inFlightGetRequests.get(key)

  if (existing) {
    return existing as Promise<T>
  }

  const request = apiClient.get<T>(url, config).then((response) => response.data)
  inFlightGetRequests.set(key, request)

  try {
    return await request
  } finally {
    inFlightGetRequests.delete(key)
  }
}

// Request Interceptor: Attach bearer token from Zustand store
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Simple queue mechanism for handling concurrent 401s during refresh
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

// Response Interceptor: Handle 401 errors, attempt token refresh, and retry original request
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    if (!error.response) {
      originalRequest._networkRetryCount = originalRequest._networkRetryCount || 0

      if (originalRequest._networkRetryCount < 2) {
        originalRequest._networkRetryCount += 1
        await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** originalRequest._networkRetryCount))
        return apiClient(originalRequest)
      }

      return Promise.reject(error)
    }

    const { status } = error.response

    // If 401 and request has not been retried yet
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        // Attempt refresh
        const refreshResponse = await axios.post<{ accessToken: string; user?: User }>(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = refreshResponse.data.accessToken
        const currentUser = refreshResponse.data.user || useAuthStore.getState().user

        if (newAccessToken && currentUser) {
          useAuthStore.getState().setAuth(currentUser, newAccessToken)
          onRefreshed(newAccessToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails (or second 401 occurs), clear authentication
        const previousRole = useAuthStore.getState().role
        useAuthStore.getState().clearAuth()

        // Redirect to appropriate login page based on user role
        if (previousRole === 'client') {
          window.location.href = '/client/login'
        } else if (previousRole === 'admin') {
          window.location.href = '/admin/login'
        } else {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
