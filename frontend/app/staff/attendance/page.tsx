'use client'

import { useState } from 'react'
import { Card, Column, DataTable, PageHeader, StatCard, StatusBadge, inputCls } from '@/components/portal/kit'
import { fmtDate, todayIST } from '@/lib/portal/api'
import { useData } from '@/lib/portal/hooks'

type Rec = { _id: string; date: string; status: string; checkIn?: string; checkOut?: string; totalMinutes: number }
type Month = { month: string; records: Rec[]; summary: { present: number; late: number; halfDay: number; onLeave: number; absent: number; totalMinutes: number }; holidays: { date: string; title: string }[] }

export default function MyAttendancePage() {
  const [month, setMonth] = useState(todayIST().slice(0, 7))
  const { data, loading, error, reload } = useData<Month>('/staff/attendance/me', { month })
  const columns: Column<Rec>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => fmtDate(r.date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ]
  const s = data?.summary
  return (
    <>
      <PageHeader title="My attendance" subtitle="Marked by your administrator. Approved leave shows up here too" />
      <div className="mb-3"><input type="month" className={`${inputCls} sm:w-auto`} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" /></div>
      {s && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Present" value={s.present} tone="green" />
          <StatCard label="Late" value={s.late} tone="amber" />
          <StatCard label="Half days" value={s.halfDay} tone="blue" />
          <StatCard label="On leave" value={s.onLeave} />
          <StatCard label="Absent" value={s.absent} tone="red" />
        </div>
      )}
      <Card>
        <DataTable columns={columns} rows={data?.records || []} loading={loading} error={error} onRetry={reload} exportName={`attendance-${month}`} emptyTitle="No attendance recorded this month" />
        {data?.holidays.length ? <p className="mt-3 text-xs text-muted-foreground">Holidays: {data.holidays.map((h) => `${fmtDate(h.date)} (${h.title})`).join(', ')}</p> : null}
      </Card>
    </>
  )
}
