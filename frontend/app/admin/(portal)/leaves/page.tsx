'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Card, Column, DataTable, FilterSelect, FormModal, PageHeader, StatusBadge, btn } from '@/components/portal/kit'
import { api, fmtDate } from '@/lib/portal/api'
import { notifyOk, useList } from '@/lib/portal/hooks'

type Leave = { _id: string; staff?: { name: string; email: string }; type: string; fromDate: string; toDate: string; days: number; reason?: string; status: string; reviewNote?: string; reviewedBy?: { name: string } }

export default function LeavesPage() {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const { rows, meta, loading, error, reload } = useList<Leave>('/admin/leaves', { status, page, limit: 20 })
  const [review, setReview] = useState<{ leave: Leave; decision: 'APPROVED' | 'REJECTED' } | null>(null)

  const columns: Column<Leave>[] = [
    { key: 'staff', header: 'Staff', sortable: true, value: (l) => l.staff?.name, render: (l) => <span className="font-medium">{l.staff?.name}</span> },
    { key: 'type', header: 'Type' },
    { key: 'dates', header: 'Dates', value: (l) => l.fromDate, render: (l) => `${fmtDate(l.fromDate)} → ${fmtDate(l.toDate)}` },
    { key: 'days', header: 'Days', sortable: true },
    { key: 'reason', header: 'Reason', mobileHidden: true },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge value={l.status} /> },
    {
      key: 'a', header: '', className: 'text-right whitespace-nowrap', render: (l) => l.status === 'PENDING' ? (
        <div className="flex justify-end gap-1">
          <button className={btn('success', 'sm')} onClick={() => setReview({ leave: l, decision: 'APPROVED' })}><Check className="h-4 w-4" /> Approve</button>
          <button className={btn('danger', 'sm')} onClick={() => setReview({ leave: l, decision: 'REJECTED' })}><X className="h-4 w-4" /> Reject</button>
        </div>
      ) : <span className="text-xs text-muted-foreground">{l.reviewedBy?.name}</span>,
    },
  ]
  return (
    <>
      <PageHeader title="Leave requests" subtitle="Approving deducts the staff leave balance and marks those days as On Leave" />
      <Card>
        <div className="mb-3"><FilterSelect label="All statuses" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} /></div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="leaves" emptyTitle="No leave requests" />
      </Card>
      <FormModal open={!!review} title={`${review?.decision === 'APPROVED' ? 'Approve' : 'Reject'} leave: ${review?.leave.staff?.name}`} submitLabel={review?.decision === 'APPROVED' ? 'Approve' : 'Reject'}
        fields={[{ name: 'reviewNote', label: 'Note to staff (optional)', type: 'textarea' }]}
        onSubmit={async (v) => { await api.patch(`/admin/leaves/${review!.leave._id}`, { status: review!.decision, reviewNote: v.reviewNote || undefined }); notifyOk(`Leave ${review!.decision.toLowerCase()}`); reload() }}
        onClose={() => setReview(null)} />
    </>
  )
}
