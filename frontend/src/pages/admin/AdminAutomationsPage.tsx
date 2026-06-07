import { Activity, Clock, Cpu, Gauge } from 'lucide-react'
import { AdminMetricCard } from '../../components/admin/AdminMetricCard'
import { AutomationRuleTable } from '../../components/admin/AutomationRuleTable'
import { automationSummary } from '../../features/admin/mockAdminData'

export const AdminAutomationsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-page-title text-primary-800">Automations</h1>
      <p className="mt-1 text-body text-neutral-600">Rules, triggers, outcomes, and operator time saved.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label="Active rules" value={automationSummary.activeRules} icon={<Cpu className="h-5 w-5" />} />
      <AdminMetricCard label="Runs this month" value={automationSummary.runsThisMonth.toLocaleString('en-US')} icon={<Activity className="h-5 w-5" />} />
      <AdminMetricCard label="Admin time saved" value={automationSummary.adminTimeSaved} icon={<Clock className="h-5 w-5" />} />
      <AdminMetricCard label="Success rate" value={automationSummary.successRate} icon={<Gauge className="h-5 w-5" />} />
    </div>

    <AutomationRuleTable />
  </div>
)
