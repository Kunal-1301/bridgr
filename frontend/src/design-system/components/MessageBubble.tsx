import { type ReactNode } from 'react'
import { cn } from '../cn'

type MessageTone = 'operator' | 'worker' | 'client' | 'system'

interface MessageBubbleProps {
  children: ReactNode
  tone?: MessageTone
  sender?: string
  timestamp?: string
  className?: string
}

const toneClasses: Record<MessageTone, string> = {
  operator: 'bg-primary-600 text-white',
  worker: 'border border-neutral-200 bg-white text-neutral-900',
  client: 'bg-primary-50 text-primary-800',
  system: 'bg-neutral-100 text-neutral-600',
}

export const MessageBubble = ({ children, tone = 'operator', sender, timestamp, className }: MessageBubbleProps) => (
  <div className={cn('max-w-[78%] space-y-1', tone === 'operator' && 'ml-auto', className)}>
    {(sender || timestamp) && (
      <div className={cn('flex items-center gap-2 text-caption', tone === 'operator' ? 'justify-end' : 'justify-start')}>
        {sender && <span className="font-semibold text-primary-800">{sender}</span>}
        {timestamp && <span className="font-mono text-neutral-600">{timestamp}</span>}
      </div>
    )}
    <div className={cn('rounded-lg px-4 py-3 text-body shadow-sm', toneClasses[tone])}>{children}</div>
  </div>
)
