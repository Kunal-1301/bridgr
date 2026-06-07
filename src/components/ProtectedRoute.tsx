import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const WorkerRoute = () => {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated || role !== 'worker') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export const ClientRoute = () => {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated || role !== 'client') {
    return <Navigate to="/client/login" replace />
  }

  return <Outlet />
}

export const AdminRoute = () => {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated || role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
