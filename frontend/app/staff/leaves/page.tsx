'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, Column, DataTable, FormModal, PageHeader, StatCard, StatusBadge, btn } from '@/components/portal/kit'
import { api, fmtDate, todayIST } from '@/lib/portal/api'
import { notifyOk, useData, useList } from '@/lib/portal/hooks'

type Leave = { _id: string; type: string; fromDate: string; toDate: string; days: number; reason?: string; status: string; reviewNote?: string }
type Dash = { leaveBalance?: { casual: number; sick: number } }

export default function StaffLeavesPage() {
  const [page, setPage] = useState(1)
  const { rows, meta, loading, error, reload } = useList<Leave>('/staff/leaves', { page, limit: 15 })
  const dash = useData<Dash>('/staff/dashboard')
  const [open, setOpen] = useState(false)

  const columns: Column<Leave>[] = [
    { key: 'type', header: 'Type' },
    { key: 'dates', header: 'Dates', render: (l) => `${fmtDate(l.fromDate)} → ${fmtDate(l.toDate)}` },
    { key: 'days', header: 'Days', sortable: true },
    { key: 'reason', header: 'Reason', mobileHidden: true },
    { key: 'status', header: 'Status', render: (l) => <span><StatusBadge value={l.status} />{l.reviewNote && <><br /><span className="text-xs text-muted-foreground">{l.reviewNote}</span></>}</span> },
  ]
  return (
    <>
      <PageHeader title="My leaves" subtitle="Working days are counted automatically (holidays and weekly offs excluded)" actions={<button className={btn('primary')} onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Request leave</button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Casual left" value={dash.data?.leaveBalance?.casual ?? '-'} tone="green" />
        <StatCard label="Sick left" value={dash.data?.leaveBalance?.sick ?? '-'} tone="amber" />
      </div>
      <Card><DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} emptyTitle="No leave requests yet" /></Card>
      <FormModal open={open} title="Request leave" submitLabel="Submit request" onClose={() => setOpen(false)}
        fields={[
          { name: 'type', label: 'Leave type', type: 'select', required: true, options: [{ value: 'CASUAL', label: 'Casual' }, { value: 'SICK', label: 'Sick' }, { value: 'UNPAID', label: 'Unpaid' }] },
          { name: 'fromDate', label: 'From', type: 'date', required: true, half: true },
          { name: 'toDate', label: 'To', type: 'date', required: true, half: true },
          { name: 'reason', label: 'Reason', type: 'textarea' },
        ]}
        initial={{ type: 'CASUAL', fromDate: todayIST(), toDate: todayIST() }}
        onSubmit={async (v) => { await api.post('/staff/leaves', { type: v.type, fromDate: v.fromDate, toDate: v.toDate, reason: v.reason || undefined }); notifyOk('Leave requested'); reload(); dash.reload() }} />
    </>
  )
}
