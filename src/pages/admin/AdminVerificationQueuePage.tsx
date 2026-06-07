import { AlertCircle } from 'lucide-react'
import { Card, Badge } from '../../design-system/components'
import { VerificationTable } from '../../components/admin/VerificationTable'

export const AdminVerificationQueuePage = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-page-title text-primary-800">Verification queue</h1>
        <p className="mt-1 text-body text-neutral-600">Review worker trust signals, documents, and skill coverage.</p>
      </div>
      <div className="flex gap-2">
        <Badge variant="warning">Pending 12</Badge>
        <Badge variant="info">Under review 4</Badge>
      </div>
    </div>

    <VerificationTable />

    <Card className="flex items-start gap-3 border-info/20 bg-info-tint p-4 text-info">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-body font-semibold">Automatic worker scoring: 80% with all docs are auto-approved. 68% handled without admin this month.</p>
    </Card>
  </div>
)
