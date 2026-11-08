'use client'

import { useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { Card, Column, DataTable, PageHeader, StatCard, StatusBadge, btn, inputCls } from '@/components/portal/kit'
import { api, fmtDate, fmtTime, todayIST } from '@/lib/portal/api'
import { notifyError, notifyOk, useData } from '@/lib/portal/hooks'

type Rec = { _id: string; date: string; status: string; checkIn?: string; checkOut?: string; totalMinutes: number }
type Month = { month: string; records: Rec[]; summary: { present: number; late: number; halfDay: number; onLeave: number; absent: number; totalMinutes: number }; holidays: { date: string; title: string }[] }

export default function MyAttendancePage() {
  const [month, setMonth] = useState(todayIST().slice(0, 7))
  const { data, loading, error, reload } = useData<Month>('/staff/attendance/me', { month })
  const [busy, setBusy] = useState(false)
  const act = async (path: string, msg: string) => {
    setBusy(true)
    try { await api.post(path); notifyOk(msg); reload() } catch (e) { notifyError(e) } finally { setBusy(false) }
  }
  const columns: Column<Rec>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => fmtDate(r.date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'checkIn', header: 'In', render: (r) => fmtTime(r.checkIn) },
    { key: 'checkOut', header: 'Out', render: (r) => fmtTime(r.checkOut) },
    { key: 'totalMinutes', header: 'Hours', render: (r) => (r.totalMinutes ? (r.totalMinutes / 60).toFixed(1) : '-') },
  ]
  const s = data?.summary
  return (
    <>
      <PageHeader title="My attendance" subtitle="Your check-ins, hours and leave for the month"
        actions={<>
          <button className={btn('success')} disabled={busy} onClick={() => act('/staff/attendance/check-in', 'Checked in')}><LogIn className="h-4 w-4" /> Check in</button>
          <button className={btn('outline')} disabled={busy} onClick={() => act('/staff/attendance/check-out', 'Checked out')}><LogOut className="h-4 w-4" /> Check out</button>
        </>} />
      <div className="mb-3"><input type="month" className={`${inputCls} sm:w-auto`} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" /></div>
      {s && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Present" value={s.present} tone="green" />
          <StatCard label="Late" value={s.late} tone="amber" />
          <StatCard label="Half days" value={s.halfDay} tone="blue" />
          <StatCard label="On leave" value={s.onLeave} />
          <StatCard label="Absent" value={s.absent} tone="red" hint={`${(s.totalMinutes / 60).toFixed(1)} hours worked`} />
        </div>
      )}
      <Card>
        <DataTable columns={columns} rows={data?.records || []} loading={loading} error={error} onRetry={reload} exportName={`attendance-${month}`} emptyTitle="No attendance recorded this month" />
        {data?.holidays.length ? <p className="mt-3 text-xs text-muted-foreground">Holidays: {data.holidays.map((h) => `${fmtDate(h.date)} (${h.title})`).join(', ')}</p> : null}
      </Card>
    </>
  )
}
