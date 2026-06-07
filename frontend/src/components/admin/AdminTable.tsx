import type { ReactNode } from 'react'
import { cn } from '../../design-system/cn'

export const AdminTable = ({ headers, children, className }: { headers: string[]; children: ReactNode; className?: string }) => (
  <div className={cn('overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm', className)}>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-neutral-50 text-caption font-bold uppercase text-neutral-600">
          <tr>{headers.map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">{children}</tbody>
      </table>
    </div>
  </div>
)
