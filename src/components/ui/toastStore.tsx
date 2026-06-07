import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'warning' | 'info'
type Toast = { id: string; title: string; message?: string; kind: ToastKind }
type ToastContextValue = {
  notify: (toast: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current.slice(-2), { ...toast, id }])
    window.setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const success = useCallback((title: string, message?: string) => notify({ kind: 'success', title, message }), [notify])
  const error = useCallback((title: string, message?: string) => notify({ kind: 'error', title, message }), [notify])
  const warning = useCallback((title: string, message?: string) => notify({ kind: 'warning', title, message }), [notify])
  const info = useCallback((title: string, message?: string) => notify({ kind: 'info', title, message }), [notify])

  const value = useMemo(() => ({ notify, success, error, warning, info }), [notify, success, error, warning, info])

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastContext.Provider value={value}>
        {children}
        {toasts.map((toast) => {
          const Icon = toast.kind === 'error' ? AlertCircle : toast.kind === 'warning' ? TriangleAlert : toast.kind === 'info' ? Info : CheckCircle2
          const tone = toast.kind === 'error' ? 'text-error bg-error-tint' : toast.kind === 'warning' ? 'text-warning bg-warning-tint' : toast.kind === 'success' ? 'text-success bg-success-tint' : 'text-info bg-info-tint'
          return (
            <ToastPrimitive.Root
              key={toast.id}
              open
              onOpenChange={(open) => !open && dismiss(toast.id)}
              duration={4000}
              className="rounded-lg border border-border bg-white p-4 shadow-lg data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=end]:animate-out"
            >
              <div className="flex gap-3">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <ToastPrimitive.Title className="text-sm font-bold text-navy">{toast.title}</ToastPrimitive.Title>
                  {toast.message ? <ToastPrimitive.Description className="mt-1 text-xs leading-5 text-muted">{toast.message}</ToastPrimitive.Description> : null}
                </div>
                <ToastPrimitive.Close onClick={() => dismiss(toast.id)} className="text-muted hover:text-navy">
                  <X className="h-4 w-4" />
                </ToastPrimitive.Close>
              </div>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 outline-none" />
      </ToastContext.Provider>
    </ToastPrimitive.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
