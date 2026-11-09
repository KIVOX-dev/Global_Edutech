'use client'

import { useState } from 'react'
import { Card, Column, DataTable, PageHeader, StatCard, StatusBadge, inputCls } from '@/components/portal/kit'
import { useChild } from '@/components/portal/ParentChild'
import { fmtDate, todayIST } from '@/lib/portal/api'
import { useData } from '@/lib/portal/hooks'

type Rec = { _id?: string; date: string; status: string; note?: string }
type Res = {
  month: string; records: Rec[]
  summary: { present: number; late: number; absent: number; excused: number; counted: number; percentage: number | null }
  overall: { percentage: number | null; counted: number }
  holidays: { date: string; title: string }[]
}

export default function ParentAttendance() {
  const { child } = useChild()
  const [month, setMonth] = useState(todayIST().slice(0, 7))
  const { data, loading, error, reload } = useData<Res>(`/parent/children/${child.id}/attendance`, { month })
  const s = data?.summary
  const columns: Column<Rec>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => fmtDate(r.date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'note', header: 'Note', mobileHidden: true, render: (r) => r.note || '-' },
  ]
  return (
    <>
      <PageHeader title="Attendance" subtitle={`${child.name} · marked by the teacher each class day`} />
      <div className="mb-3"><input type="month" className={`${inputCls} sm:w-auto`} value={month} max={todayIST().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" /></div>
      {s && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="This month" value={s.percentage === null ? '--' : `${s.percentage}%`} tone={s.percentage === null ? 'purple' : s.percentage >= 75 ? 'green' : 'red'} hint={s.counted ? `${s.counted} classes` : undefined} />
          <StatCard label="Present" value={s.present} tone="green" />
          <StatCard label="Late" value={s.late} tone="amber" />
          <StatCard label="Absent" value={s.absent} tone="red" />
          <StatCard label="Overall" value={data.overall.percentage === null ? '--' : `${data.overall.percentage}%`} tone="blue" hint="Since joining" />
        </div>
      )}
      <Card>
        <DataTable columns={columns} rows={data?.records || []} loading={loading} error={error} onRetry={reload} emptyTitle="No attendance marked this month" />
        {data?.holidays.length ? <p className="mt-3 text-xs text-muted-foreground">Holidays: {data.holidays.map((h) => `${fmtDate(h.date)} (${h.title})`).join(', ')}</p> : null}
      </Card>
    </>
  )
}
