import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}: ConfirmModalProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150" />

        {/* Dialog Content Card */}
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-lg border border-border p-6 shadow-lg outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-4">
            {isDestructive && (
              <div className="p-2 bg-error-tint rounded-full text-error flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1">
              <Dialog.Title className="text-lg font-bold text-navy leading-none mb-2">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-md border border-border bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors">
                {cancelText}
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm()
                onClose(false)
              }}
              className={clsx(
                'px-4 py-2 rounded-md text-sm font-semibold text-white focus:outline-none transition-colors shadow-sm',
                isDestructive
                  ? 'bg-error hover:bg-red-700'
                  : 'bg-blue hover:bg-blue-600'
              )}
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
