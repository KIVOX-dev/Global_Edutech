'use client'

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Card, Column, DataTable, FilterSelect, FormModal, PageHeader, StatusBadge, btn, inputCls } from '@/components/portal/kit'
import MarkSheet from '@/components/portal/MarkSheet'
import { api, fmtDate, todayIST } from '@/lib/portal/api'
import { notifyError, notifyOk, useData, useList } from '@/lib/portal/hooks'
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
        <input type="date" className={`${inputCls} sm:w-auto`} value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
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
    { key: 'a', header: '', className: 'text-right', render: (r) => <button className={btn('ghost', 'sm')} onClick={() => setEdit(r)} title="Correct"><Pencil className="h-4 w-4" /></button> },
  ]
  return (
    <>
    <StaffMarkSheet onSaved={reload} />
    <Card title="Staff attendance records">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <input type="date" className={`${inputCls} sm:w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="From" />
        <span>to</span>
        <input type="date" className={`${inputCls} sm:w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="To" />
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
    </>
  )
}

type Roster = { date: string; isWorkingDay: boolean; reason: string | null; staff: { id: string; name: string; email: string; status: string | null }[] }
const STAFF_STATUS = [
  { v: 'PRESENT', label: 'Present', on: 'bg-emerald-600 text-white border-emerald-600', off: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
  { v: 'LATE', label: 'Late', on: 'bg-amber-500 text-white border-amber-500', off: 'text-amber-700 border-amber-200 bg-amber-50' },
  { v: 'HALF_DAY', label: 'Half day', on: 'bg-sky-600 text-white border-sky-600', off: 'text-sky-700 border-sky-200 bg-sky-50' },
  { v: 'ON_LEAVE', label: 'Leave', on: 'bg-purple text-white border-purple', off: 'text-purple border-purple/20 bg-purple/5' },
  { v: 'ABSENT', label: 'Absent', on: 'bg-red-600 text-white border-red-600', off: 'text-red-700 border-red-200 bg-red-50' },
]

// Only the admin records staff attendance: pick a date, tap a status per person, save
function StaffMarkSheet({ onSaved }: { onSaved: () => void }) {
  const [date, setDate] = useState(todayIST())
  const { data, loading, error, reload } = useData<Roster>('/admin/attendance/staff-roster', { date })
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { setPicked(Object.fromEntries((data?.staff || []).filter((s) => s.status).map((s) => [s.id, s.status as string]))) }, [data])

  const setAll = () => setPicked(Object.fromEntries((data?.staff || []).map((s) => [s.id, 'PRESENT'])))
  const save = async () => {
    setBusy(true)
    try {
      const entries = Object.entries(picked).map(([staffId, status]) => ({ staffId, status }))
      await api.post('/admin/attendance/staff-mark', { date, entries })
      notifyOk('Staff attendance saved')
      reload(); onSaved()
    } catch (e) { notifyError(e) } finally { setBusy(false) }
  }
  const missing = (data?.staff || []).filter((s) => !picked[s.id]).length

  return (
    <Card title="Mark staff attendance" className="mb-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input type="date" className={`${inputCls} sm:w-auto`} value={date} max={todayIST()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
        <button className={btn('outline', 'sm')} onClick={setAll} disabled={!data?.isWorkingDay}>Mark all present</button>
      </div>
      {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p> : error ? <p className="py-6 text-center text-sm text-red-600">{error}</p> : !data?.isWorkingDay ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{data?.reason || 'Not a working day'}. Attendance cannot be marked.</p>
      ) : !data.staff.length ? <p className="py-6 text-center text-sm text-muted-foreground">No active staff yet.</p> : (
        <>
          <ul className="divide-y">
            {data.staff.map((s) => (
              <li key={s.id} className="py-2.5">
                <p className="mb-1.5 text-sm font-medium">{s.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAFF_STATUS.map((o) => (
                    <button key={o.v} type="button" onClick={() => setPicked((p) => ({ ...p, [s.id]: o.v }))}
                      className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition ${picked[s.id] === o.v ? o.on : o.off}`}>{o.label}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{missing ? `${missing} not marked` : 'Everyone marked'}</span>
            <button className={btn('primary')} disabled={busy || !Object.keys(picked).length} onClick={save}>{busy ? 'Saving…' : 'Save attendance'}</button>
          </div>
        </>
      )}
    </Card>
  )
}
