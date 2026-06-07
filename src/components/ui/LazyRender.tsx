import { useEffect, useRef, useState, type ReactNode } from 'react'

interface LazyRenderProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  className?: string
}

export const LazyRender = ({ children, fallback = null, rootMargin = '180px', className }: LazyRenderProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (shouldRender) return

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    const element = ref.current
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin, shouldRender])

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : fallback}
    </div>
  )
}
