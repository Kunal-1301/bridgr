import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  role: 'admin' | 'worker' | 'client' | 'affiliate'
  fullName?: string
}

export interface AuthState {
  user: User | null
  role: 'admin' | 'worker' | 'client' | 'affiliate' | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({
          user,
          role: user.role as 'admin' | 'worker' | 'client' | 'affiliate',
          accessToken: token,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          role: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'bridgr-auth-storage',
    }
  )
)
