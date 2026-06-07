import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BrandLogo, Button } from '../design-system/components'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info)
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
        <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-md">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <h1 className="mt-5 text-page-title text-primary-800">Something went wrong</h1>
          <p className="mt-3 text-body text-neutral-600">Reload the page to recover the Bridgr workspace.</p>
          <Button onClick={() => window.location.reload()} className="mt-6">Reload page</Button>
          {import.meta.env.DEV ? (
            <pre className="mt-6 max-h-40 overflow-auto rounded-md bg-slate-950 p-3 text-left text-xs text-white">{this.state.error.message}</pre>
          ) : null}
        </div>
      </div>
    )
  }
}
