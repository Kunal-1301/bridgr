import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileDown } from 'lucide-react'
import { clientKeys, getClientPayments, type ClientInvoice } from '../../api/clientPortal'
import { Button, Card, StatusBadge } from '../../design-system/components'
import { mockInvoices } from '../../features/client/mockClientData'
import { dateShort, usd } from './clientUtils'

export const ClientPaymentsPage = () => {
  const paymentsQuery = useQuery({ queryKey: clientKeys.payments(), queryFn: getClientPayments })
  const invoices: ClientInvoice[] = paymentsQuery.data?.invoices || mockInvoices
  const summary = paymentsQuery.data?.summary

  const paidToDate = summary?.totalSpent ?? invoices.filter((invoice: ClientInvoice) => invoice.status === 'Paid').reduce((sum: number, invoice: ClientInvoice) => sum + invoice.amount, 0)
  const outstanding = summary?.outstanding ?? invoices.filter((invoice: ClientInvoice) => invoice.status === 'Pending').reduce((sum: number, invoice: ClientInvoice) => sum + invoice.amount, 0)
  const nextDue = useMemo(() => invoices.find((invoice) => invoice.status === 'Pending'), [invoices])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-page-title text-primary-800">Payments</h1>
          <p className="mt-1 text-body text-neutral-600">Invoices, outstanding milestones, and payment records.</p>
        </div>
        <Button variant="secondary" iconLeft={<FileDown className="h-4 w-4" />}>Export CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Paid to date" value={usd(paidToDate)} />
        <Metric title="Outstanding" value={usd(outstanding)} tone="warning" />
        <Metric title="Next due" value={nextDue ? usd(nextDue.amount) : '$0'} />
        <Metric title="Payment method" value="Visa 4242" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-section text-primary-800">Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-neutral-50 text-caption font-bold uppercase text-neutral-600">
              <tr>
                <th className="px-5 py-3">Invoice id</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-5 py-4 font-mono text-caption font-bold text-primary-800">{invoice.invoiceNo}</td>
                  <td className="px-5 py-4 text-body font-semibold text-neutral-900">{invoice.job}</td>
                  <td className="px-5 py-4 text-body text-neutral-600">{dateShort(invoice.date)}</td>
                  <td className="px-5 py-4 font-mono text-body font-bold text-primary-800">{usd(invoice.amount)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={invoice.status === 'Paid' ? 'approved' : 'pending'} label={invoice.status} />
                  </td>
                  <td className="px-5 py-4">
                    {invoice.status === 'Pending' ? (
                      <Button size="sm" variant="amber">Pay</Button>
                    ) : (
                      <Button size="sm" variant="secondary" iconLeft={<Download className="h-3.5 w-3.5" />}>Download</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const Metric = ({ title, value, tone }: { title: string; value: string; tone?: 'warning' }) => (
  <Card className="p-5">
    <p className="text-caption font-bold uppercase text-neutral-600">{title}</p>
    <p className={`mt-3 font-mono text-[24px] font-bold leading-none ${tone === 'warning' ? 'text-warning' : 'text-primary-800'}`}>{value}</p>
  </Card>
)
