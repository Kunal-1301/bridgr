import type { ReactNode } from 'react'
import { Card } from '../../design-system/components'

export const AdminMetricCard = ({ label, value, helper, icon }: { label: string; value: string | number; helper?: string; icon?: ReactNode }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-caption font-bold uppercase text-neutral-600">{label}</p>
        <p className="mt-3 font-mono text-[28px] font-bold leading-none text-primary-800">{value}</p>
        {helper && <p className="mt-2 text-caption font-semibold text-neutral-600">{helper}</p>}
      </div>
      {icon && <div className="rounded-md bg-primary-50 p-2 text-primary-600">{icon}</div>}
    </div>
  </Card>
)
