export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
)

export const StatCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
    <Skeleton className="h-3 w-28" />
    <Skeleton className="mt-5 h-8 w-32" />
    <Skeleton className="mt-3 h-3 w-20" />
  </div>
)

export const JobCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="mt-4 h-3 w-full" />
    <Skeleton className="mt-2 h-3 w-4/5" />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
)

export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr>
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-3.5">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
)

export const WorkerCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
    <div className="flex gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-3 w-52" />
      </div>
    </div>
    <Skeleton className="mt-5 h-2 w-full rounded-full" />
  </div>
)
