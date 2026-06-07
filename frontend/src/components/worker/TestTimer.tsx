import { useEffect, useMemo, useRef, useState } from 'react'
import { Timer } from 'lucide-react'
import { useToast } from '../ui/toastStore'

interface TestTimerProps {
  timeLimit: number
  onSubmit: () => void
}

export const TestTimer = ({ timeLimit, onSubmit }: TestTimerProps) => {
  const [seconds, setSeconds] = useState(timeLimit * 60)
  const tabSwitchCount = useRef(0)
  const submitted = useRef(false)
  const { warning } = useToast()

  const handleAutoSubmit = () => {
    if (submitted.current) return
    submitted.current = true
    onSubmit()
  }

  useEffect(() => {
    setSeconds(timeLimit * 60)
    submitted.current = false
  }, [timeLimit])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return
      tabSwitchCount.current += 1
      if (tabSwitchCount.current === 1) {
        warning('Warning: Leaving the test tab. Second violation auto-submits.')
      }
      if (tabSwitchCount.current >= 2) handleAutoSubmit()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [warning])

  const label = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, [seconds])
  const tone = seconds < 60 ? 'bg-error-tint text-error animate-pulse' : seconds < 300 ? 'bg-amber-tint text-amber' : 'bg-blue-tint text-blue'

  return (
    <span className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${tone}`}>
      <Timer className="h-4 w-4" />
      {label}
    </span>
  )
}
