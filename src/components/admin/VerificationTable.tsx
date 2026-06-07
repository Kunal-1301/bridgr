import { Button, ProgressBar, SkillTag, StatusBadge } from '../../design-system/components'
import { AdminTable } from './AdminTable'
import { verificationRows } from '../../features/admin/mockAdminData'

export const VerificationTable = () => (
  <AdminTable headers={['Worker', 'Trust', 'Skills', 'ID proof', 'Actions']}>
    {verificationRows.map((row) => (
      <tr key={row.id}>
        <td className="px-5 py-4">
          <div className="font-bold text-primary-800">{row.worker}</div>
          <StatusBadge status={row.status === 'Pending' ? 'pending' : 'scheduled'} label={row.status} className="mt-2" />
        </td>
        <td className="px-5 py-4">
          <div className="w-32"><ProgressBar value={row.trust} showValue /></div>
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-wrap gap-2">{row.skills.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}</div>
        </td>
        <td className="px-5 py-4 text-body font-semibold text-neutral-600">{row.idProof}</td>
        <td className="px-5 py-4">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">View</Button>
            <Button size="sm" variant="danger">Reject</Button>
            <Button size="sm">Approve</Button>
          </div>
        </td>
      </tr>
    ))}
  </AdminTable>
)
