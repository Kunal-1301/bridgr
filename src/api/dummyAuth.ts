import type { User } from '../store/authStore'

export const isDemoAuthEnabled = () =>
  import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true'

export const createDemoUser = (email: string, role: User['role'], fullName?: string): User => ({
  id: `${role}-demo`,
  email,
  role,
  fullName: fullName || (role === 'client' ? 'Client User' : role === 'admin' ? 'Admin User' : 'Worker User'),
})

export const createDemoToken = (role: User['role']) => `demo-${role}-token`
