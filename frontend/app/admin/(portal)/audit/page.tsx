'use client'

import { useState } from 'react'
import { Card, Column, DataTable, FilterSelect, Modal, PageHeader, SearchBox, btn, inputCls } from '@/components/portal/kit'
import { fmtDateTime } from '@/lib/portal/api'
import { useList } from '@/lib/portal/hooks'

type Audit = { _id: string; actorName?: string; action: string; entity: string; entityId?: string; before?: unknown; after?: unknown; ip?: string; createdAt: string }
const ENTITIES = ['User', 'Student', 'Course', 'Batch', 'StudentAttendance', 'StaffAttendance', 'LeaveRequest', 'Payment', 'StudentFee', 'FeeStructure', 'Holiday', 'Setting', 'ReminderSetting']

export default function AuditPage() {
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const { rows, meta, loading, error, reload } = useList<Audit>('/admin/audit-logs', { page, limit: 25, entity, action, from, to })
  const [view, setView] = useState<Audit | null>(null)

  const columns: Column<Audit>[] = [
    { key: 'createdAt', header: 'When', sortable: true, render: (a) => fmtDateTime(a.createdAt) },
    { key: 'actorName', header: 'Actor', sortable: true, render: (a) => a.actorName || 'System' },
    { key: 'action', header: 'Action', render: (a) => <span className="font-mono text-xs">{a.action}</span> },
    { key: 'entity', header: 'Entity', mobileHidden: true },
    { key: 'ip', header: 'IP', mobileHidden: true },
    { key: 'd', header: '', className: 'text-right', render: (a) => <button className={btn('ghost', 'sm')} onClick={() => setView(a)}>Details</button> },
  ]
  return (
    <>
      <PageHeader title="Audit log" subtitle="Who changed what, and when" />
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FilterSelect label="Any entity" value={entity} onChange={(v) => { setEntity(v); setPage(1) }} options={ENTITIES.map((e) => ({ value: e, label: e }))} />
          <SearchBox value={action} onChange={(v) => { setAction(v.toUpperCase()); setPage(1) }} placeholder="Action, e.g. RECORD_PAYMENT" />
          <input type="date" className={`${inputCls} sm:w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="From" />
          <input type="date" className={`${inputCls} sm:w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="To" />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="audit-log" emptyTitle="No audit entries" />
      </Card>
      <Modal open={!!view} title={view?.action || ''} onClose={() => setView(null)} wide>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Actor</dt><dd>{view?.actorName || 'System'}</dd>
          <dt className="text-muted-foreground">Entity</dt><dd>{view?.entity} {view?.entityId}</dd>
          <dt className="text-muted-foreground">When</dt><dd>{fmtDateTime(view?.createdAt)}</dd>
        </dl>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(['before', 'after'] as const).map((k) => (
            <div key={k}><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{k}</p>
              <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-2 text-xs">{view?.[k] ? JSON.stringify(view[k], null, 2) : '—'}</pre></div>
          ))}
        </div>
      </Modal>
    </>
  )
}
