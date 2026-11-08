'use client'

import Link from 'next/link'
import { Card, ErrorState, PageHeader, Spinner, StatCard, StatusBadge, btn } from '@/components/portal/kit'
import { fmtDate } from '@/lib/portal/api'
import { useData } from '@/lib/portal/hooks'
import { useAuth } from '@/lib/portal/auth'
import { Donut, TrendChart, TrendPoint } from '@/components/portal/Charts'

type Dash = {
  date: string; isWorkingDay: boolean; reason: string | null; batchCount: number; studentCount: number
  pendingAttendance: { id: string; name: string }[]
  todayAttendance: { status: string; checkIn?: string; checkOut?: string; totalMinutes?: number } | null
  students: { today: { present: number; absent: number; late: number; excused: number; unmarked: number; total: number }; trend: TrendPoint[]; threshold: number; low: { id: string; name: string; admissionNo: string; batch?: string; percentage: number }[] }
  leaveBalance?: { casual: number; sick: number }; shift: { start: string; end: string } | null; pendingLeaves: number
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const { data: d, loading, error, reload } = useData<Dash>('/staff/dashboard')

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !d) return <ErrorState message={error || 'Could not load the dashboard'} onRetry={reload} />

  const t = d.todayAttendance

  return (
    <>
      <PageHeader title={`Hello, ${user?.name.split(' ')[0] || ''}`} subtitle={`${fmtDate(d.date)}${d.shift ? ` · shift ${d.shift.start}–${d.shift.end}` : ''}`} />

      <Card title="My attendance today">
        {!d.isWorkingDay ? <p className="text-sm text-muted-foreground">{d.reason}. No attendance today.</p> : (
          <p className="text-sm">{t ? <StatusBadge value={t.status} /> : <span className="text-muted-foreground">Not marked yet. Your administrator records staff attendance.</span>}</p>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="My batches" value={d.batchCount} />
        <StatCard label="My students" value={d.studentCount} tone="blue" />
        <StatCard label="Casual leave left" value={d.leaveBalance?.casual ?? '-'} tone="green" />
        <StatCard label="Sick leave left" value={d.leaveBalance?.sick ?? '-'} tone="amber" hint={d.pendingLeaves ? `${d.pendingLeaves} request(s) pending` : undefined} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Today's student attendance">
          {(() => {
            const t = d.students.today
            const attended = t.present + t.late
            const counted = attended + t.absent
            return (
              <Donut
                centerLabel="attended"
                centerValue={counted ? `${Math.round((attended / counted) * 100)}%` : '--'}
                slices={[
                  { label: 'Present', value: t.present, color: '#10b981' },
                  { label: 'Absent', value: t.absent, color: '#ef4444' },
                  { label: 'Late', value: t.late, color: '#f59e0b' },
                  { label: 'Excused', value: t.excused, color: '#0ea5e9' },
                  { label: 'Not marked', value: t.unmarked, color: '#c9c2dc' },
                ]}
              />
            )
          })()}
        </Card>
        <Card title={`Needs attention (below ${d.students.threshold}%, last 30 days)`}>
          {d.students.low.length === 0 ? <p className="py-6 text-center text-sm text-emerald-700">Every student is above the threshold.</p> : (
            <ul className="divide-y text-sm">
              {d.students.low.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0"><span className="block truncate font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.admissionNo}{s.batch ? ` · ${s.batch}` : ''}</span></span>
                  <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{s.percentage}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Student attendance trend (last 14 days)" className="mt-4">
        <TrendChart data={d.students.trend} />
        <p className="mt-2 text-xs text-muted-foreground">Percentage of students present or late on each school day. Tap a point for the day's numbers.</p>
      </Card>

      <Card title="Attendance to mark today" className="mt-4">
        {!d.isWorkingDay ? <p className="text-sm text-muted-foreground">Nothing to mark: {d.reason}.</p> : d.pendingAttendance.length === 0 ? <p className="text-sm text-emerald-700">All your batches are marked for today</p> : (
          <ul className="space-y-2">
            {d.pendingAttendance.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                <span className="font-medium">{b.name}</span>
                <Link href={`/staff/mark?batch=${b.id}`} className={btn('primary', 'sm')}>Mark now</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
