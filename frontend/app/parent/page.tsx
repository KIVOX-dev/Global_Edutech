'use client'

import Link from 'next/link'
import { CalendarClock, CalendarDays, IndianRupee } from 'lucide-react'
import { Card, PageHeader, StatCard, StatusBadge, btn } from '@/components/portal/kit'
import { useChild } from '@/components/portal/ParentChild'
import { fmtDate, money } from '@/lib/portal/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

export default function ParentHome() {
  const { child: c } = useChild()
  const w = c.window
  const a = c.attendance30
  const f = c.fees
  const pct = a.percentage
  const classDays = [...(c.course?.classDays || [])].sort().map((d) => DAYS[d]).join(', ')

  return (
    <>
      <PageHeader title={c.name} subtitle={`${c.course?.name || 'No course yet'}${c.batch ? ` · ${c.batch.name}` : ''} · Adm. ${c.admissionNo}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today" value={c.today ? <StatusBadge value={c.today} /> : <span className="text-base">Not marked</span>} tone="blue" />
        <StatCard label="Attendance (30 days)" value={pct === null ? '--' : `${pct}%`} tone={pct === null ? 'purple' : pct >= 75 ? 'green' : 'red'} hint={a.counted ? `${a.present + a.late} present of ${a.counted} classes` : 'No classes marked yet'} />
        <StatCard label="Course days left" value={w.daysRemaining === null ? '--' : w.daysRemaining} tone="amber" hint={w.end ? `Ends ${fmtDate(w.end)}` : 'End date not set'} />
        <StatCard label="Fee due" value={money(f.totalDue)} tone={f.overdueAmount > 0 ? 'red' : f.totalDue > 0 ? 'amber' : 'green'} hint={f.overdueAmount > 0 ? `${money(f.overdueAmount)} overdue` : f.totalDue > 0 ? undefined : 'All paid'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Course duration">
          <div className="flex items-start gap-3 text-sm">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-purple" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.course?.name || '-'}</p>
              <p className="text-muted-foreground">{fmtDate(w.start)}{w.end ? ` to ${fmtDate(w.end)}` : ''}</p>
              {w.progress !== null && (
                <>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-purple/10" role="progressbar" aria-valuenow={w.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-purple transition-all" style={{ width: `${w.progress}%` }} />
                  </div>
                  <p className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-muted-foreground">
                    <span>{plural(w.daysDone || 0, 'day')} done ({w.progress}%)</span>
                    <span className="font-semibold text-foreground">{w.status === 'COMPLETED' ? 'Course completed' : w.status === 'NOT_STARTED' ? 'Not started yet' : `${plural(w.daysRemaining || 0, 'day')} remaining`}</span>
                  </p>
                </>
              )}
              {classDays && <p className="mt-3 text-xs text-muted-foreground">Classes: <span className="font-medium text-foreground">{classDays}</span>{c.batch?.timings ? ` · ${c.batch.timings}` : ''}</p>}
            </div>
          </div>
        </Card>

        <Card title="Next fee payment" actions={<Link href="/parent/fees" className={btn('outline', 'sm')}>All fees</Link>}>
          <div className="flex items-start gap-3 text-sm">
            <IndianRupee className="mt-0.5 h-5 w-5 shrink-0 text-purple" />
            <div className="min-w-0 flex-1">
              {f.next ? (
                <>
                  <p className="font-display text-2xl font-bold">{money(f.next.amount)}</p>
                  <p className="text-muted-foreground">{f.next.label} · due {fmtDate(f.next.dueDate)}</p>
                  <p className="mt-1 font-semibold">{f.next.daysToDue === 0 ? 'Due today' : `Due in ${plural(f.next.daysToDue, 'day')}`}</p>
                </>
              ) : f.overdueAmount > 0 ? (
                <p className="font-semibold text-red-700">{money(f.overdueAmount)} is overdue. Please pay at the institute.</p>
              ) : <p className="font-medium text-emerald-700">No fee is due right now.</p>}
              <p className="mt-3 text-xs text-muted-foreground">Paid {money(f.totalPaid)} of {money(f.totalFee)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Last 30 days of attendance" className="mt-4" actions={<Link href="/parent/attendance" className={btn('outline', 'sm')}>Open calendar</Link>}>
        <div className="flex items-start gap-3 text-sm">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-purple" />
          <p className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            <span>Present <b>{a.present}</b></span><span>Late <b>{a.late}</b></span><span>Absent <b>{a.absent}</b></span><span>Excused <b>{a.excused}</b></span>
          </p>
        </div>
      </Card>
    </>
  )
}
