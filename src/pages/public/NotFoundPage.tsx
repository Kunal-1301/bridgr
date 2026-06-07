import { Link } from 'react-router-dom'

export const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12 text-center">
    <div className="max-w-md">
      <p className="text-7xl font-bold text-navy">404</p>
      <h1 className="mt-5 text-2xl font-bold text-navy">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-muted">The page you are looking for does not exist or may have moved.</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/" className="rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">Go to Home</Link>
        <Link to="/login" className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-bold text-blue">Go to Login</Link>
      </div>
    </div>
  </div>
)
