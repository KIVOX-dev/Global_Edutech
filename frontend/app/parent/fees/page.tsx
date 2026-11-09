'use client'

import { Card, Column, DataTable, PageHeader, StatCard, StatusBadge } from '@/components/portal/kit'
import { useChild } from '@/components/portal/ParentChild'
import { fmtDate, money } from '@/lib/portal/api'
import { useData } from '@/lib/portal/hooks'

type Inst = { id: string; label: string; amountDue: number; amountPaid: number; balance: number; dueDate: string; status: string; daysToDue: number }
type Pay = { _id: string; amount: number; paidOn: string; mode: string; receiptNo?: string }
type Res = { totalFee: number; totalPaid: number; totalDue: number; overdueAmount: number; overdueCount: number; installments: Inst[]; payments: Pay[] }

export default function ParentFees() {
  const { child } = useChild()
  const { data, loading, error, reload } = useData<Res>(`/parent/children/${child.id}/fees`)
  const inst: Column<Inst>[] = [
    { key: 'label', header: 'Instalment', render: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'dueDate', header: 'Due date', sortable: true, render: (r) => <span>{fmtDate(r.dueDate)}{r.balance > 0 && r.status !== 'OVERDUE' && r.daysToDue >= 0 ? <span className="block text-xs text-muted-foreground">{r.daysToDue === 0 ? 'today' : `in ${r.daysToDue} day${r.daysToDue === 1 ? '' : 's'}`}</span> : null}</span> },
    { key: 'amountDue', header: 'Amount', render: (r) => money(r.amountDue) },
    { key: 'amountPaid', header: 'Paid', mobileHidden: true, render: (r) => money(r.amountPaid) },
    { key: 'balance', header: 'Balance', render: (r) => <span className={r.status === 'OVERDUE' ? 'font-semibold text-red-700' : ''}>{money(r.balance)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ]
  const pay: Column<Pay>[] = [
    { key: 'paidOn', header: 'Date', render: (p) => fmtDate(p.paidOn) },
    { key: 'amount', header: 'Amount', render: (p) => money(p.amount) },
    { key: 'mode', header: 'Mode' },
    { key: 'receiptNo', header: 'Receipt', mobileHidden: true, render: (p) => p.receiptNo || '-' },
  ]
  return (
    <>
      <PageHeader title="Fees" subtitle={`${child.name} · instalments and payments. Pay at the institute and the receipt shows here`} />
      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total fee" value={money(data.totalFee)} />
          <StatCard label="Paid" value={money(data.totalPaid)} tone="green" />
          <StatCard label="Due" value={money(data.totalDue)} tone={data.totalDue > 0 ? 'amber' : 'green'} />
          <StatCard label="Overdue" value={money(data.overdueAmount)} tone={data.overdueAmount > 0 ? 'red' : 'green'} hint={data.overdueCount ? `${data.overdueCount} instalment(s)` : undefined} />
        </div>
      )}
      <Card title="Instalments">
        <DataTable columns={inst} rows={data?.installments || []} loading={loading} error={error} onRetry={reload} emptyTitle="No fees raised yet" />
      </Card>
      <Card title="Payments received" className="mt-4">
        <DataTable columns={pay} rows={data?.payments || []} loading={loading} error={error} onRetry={reload} emptyTitle="No payments yet" />
      </Card>
    </>
  )
}
