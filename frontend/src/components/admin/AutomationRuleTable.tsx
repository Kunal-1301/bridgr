import { useState } from 'react'
import { automationRules } from '../../features/admin/mockAdminData'
import { AdminTable } from './AdminTable'

export const AutomationRuleTable = () => {
  const [rules, setRules] = useState(automationRules)

  return (
    <AdminTable headers={['Rule', 'Trigger', 'Runs', 'Status']}>
      {rules.map((rule) => (
        <tr key={rule.name}>
          <td className="px-5 py-4 font-bold text-primary-800">{rule.name}</td>
          <td className="px-5 py-4 text-body text-neutral-600">{rule.trigger}</td>
          <td className="px-5 py-4 font-mono text-body font-bold text-neutral-900">{rule.runs}</td>
          <td className="px-5 py-4">
            <button
              type="button"
              onClick={() => setRules((current) => current.map((item) => item.name === rule.name ? { ...item, status: !item.status } : item))}
              className={`relative h-6 w-11 rounded-full transition ${rule.status ? 'bg-success' : 'bg-neutral-300'}`}
              aria-label={`Toggle ${rule.name}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${rule.status ? 'left-6' : 'left-1'}`} />
            </button>
          </td>
        </tr>
      ))}
    </AdminTable>
  )
}
