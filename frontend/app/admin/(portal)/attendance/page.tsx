'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Card, Column, DataTable, FilterSelect, FormModal, PageHeader, StatusBadge, btn, inputCls } from '@/components/portal/kit'
import MarkSheet from '@/components/portal/MarkSheet'
import { api, fmtDate, fmtTime, todayIST } from '@/lib/portal/api'
import { notifyOk, useList } from '@/lib/portal/hooks'
import { useBatchOptions } from '@/lib/portal/options'

type StaffRec = { _id: string; date: string; status: string; checkIn?: string; checkOut?: string; totalMinutes: number; staff?: { _id: string; name: string } }

const addDays = (d: string, n: number) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10) }

export default function AdminAttendancePage() {
  const [tab, setTab] = useState<'students' | 'staff'>('students')
  return (
    <>
      <PageHeader title="Attendance" subtitle="Admins can mark and correct attendance for any date, without the staff edit window" />
      <div className="mb-4 inline-flex rounded-xl border bg-card p-1" role="tablist">
        {(['students', 'staff'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? 'bg-purple text-white' : 'hover:bg-muted'}`}>{t}</button>
        ))}
      </div>
      {tab === 'students' ? <StudentTab /> : <StaffTab />}
    </>
  )
}

function StudentTab() {
  const batches = useBatchOptions()
  const [batch, setBatch] = useState('')
  const [date, setDate] = useState(todayIST())
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterSelect label="Select batch" value={batch} onChange={setBatch} options={batches} />
        <input type="date" className={`${inputCls} w-auto`} value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      </div>
      {batch && date ? <MarkSheet key={`${batch}-${date}`} batchId={batch} date={date} /> : <p className="py-10 text-center text-sm text-muted-foreground">Choose a batch and a date to load the roster.</p>}
    </Card>
  )
}

function StaffTab() {
  const [from, setFrom] = useState(addDays(todayIST(), -6))
  const [to, setTo] = useState(todayIST())
  const [page, setPage] = useState(1)
  const { rows, meta, loading, error, reload } = useList<StaffRec>('/admin/attendance/staff', { from, to, page, limit: 30 })
  const [edit, setEdit] = useState<StaffRec | null>(null)

  const columns: Column<StaffRec>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => fmtDate(r.date) },
    { key: 'staff', header: 'Staff', sortable: true, value: (r) => r.staff?.name, render: (r) => <span className="font-medium">{r.staff?.name}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'checkIn', header: 'In', value: (r) => r.checkIn, render: (r) => fmtTime(r.checkIn) },
    { key: 'checkOut', header: 'Out', value: (r) => r.checkOut, render: (r) => fmtTime(r.checkOut) },
    { key: 'hours', header: 'Hours', mobileHidden: true, value: (r) => r.totalMinutes, render: (r) => (r.totalMinutes ? (r.totalMinutes / 60).toFixed(1) : '-') },
    { key: 'a', header: '', className: 'text-right', render: (r) => <button className={btn('ghost', 'sm')} onClick={() => setEdit(r)} title="Correct"><Pencil className="h-4 w-4" /></button> },
  ]
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <input type="date" className={`${inputCls} w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="From" />
        <span>to</span>
        <input type="date" className={`${inputCls} w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="To" />
      </div>
      <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="staff-attendance" emptyTitle="No staff attendance in this range" />
      <FormModal open={!!edit} title={`Correct attendance: ${edit?.staff?.name}`} submitLabel="Save correction"
        fields={[
          { name: 'status', label: 'Status', type: 'select', required: true, options: ['PRESENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'ABSENT'].map((v) => ({ value: v, label: v.replace('_', ' ') })) },
          { name: 'note', label: 'Note', type: 'textarea' },
        ]}
        initial={edit || undefined}
        onSubmit={async (v) => { await api.patch(`/admin/attendance/staff/${edit!._id}`, { status: v.status, note: v.note || undefined }); notifyOk('Attendance corrected'); reload() }}
        onClose={() => setEdit(null)} />
    </Card>
  )
}
