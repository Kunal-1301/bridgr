export const RouteLoader = () => (
  <div className="w-full p-4 sm:p-6">
    <div className="mx-auto w-full max-w-6xl rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-navy" />
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded-full bg-blue-tint" />
          <div className="h-2.5 w-44 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-md border border-border bg-surface p-4">
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-11/12 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-8/12 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  </div>
)
