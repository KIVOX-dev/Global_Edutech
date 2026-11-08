'use client'

import Link from 'next/link'
import { Card, ErrorState, PageHeader, Spinner, StatCard, StatusBadge } from '@/components/portal/kit'
import { fmtDateTime, money } from '@/lib/portal/api'
import { useData } from '@/lib/portal/hooks'
import { TrendChart, TrendPoint } from '@/components/portal/Charts'
import { api } from '@/lib/portal/api'
import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { btn } from '@/components/portal/kit'

type Dash = {
  counts: { students: number; staff: number; courses: number; batches: number; pendingLeaves: number; newEnquiries: number }
  today: { date: string; isWorkingDay: boolean; studentAttendancePercent: number | null; studentsMarked: number; staffPresent: number }
  lowAttendance: { threshold: number; students: { id: string; name: string; admissionNo: string; batch?: string; percentage: number }[] }
  fees: { collectedTotal: number; collectedThisMonth: number; pending: { amount: number; count: number }; overdue: { amount: number; count: number }; dueToday: { amount: number; count: number } }
  trend: TrendPoint[]
  recentActivity: { _id: string; actorName?: string; action: string; entity: string; createdAt: string }[]
}

type Insights = { headline: string; bullets: string[]; source: 'ai' | 'fallback'; generatedAt: string }

// Plain-language summary of the numbers. Uses Groq when available, otherwise a rule-based summary.
function InsightsCard() {
  const [data, setData] = useState<Insights | null>(null)
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const load = async () => {
    setBusy(true)
    setErr(null)
    try { setData((await api.get<Insights>('/admin/ai/insights')).data) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load insights') } finally { setBusy(false) }
  }
  useEffect(() => { load() }, [])
  return (
    <Card title="This week at a glance" className="mt-5" actions={<button className={btn('ghost', 'sm')} onClick={load} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Refresh</button>}>
      {err ? <p className="text-sm text-red-700">{err}</p> : !data ? <p className="py-4 text-center text-sm text-muted-foreground">Writing your summary…</p> : (
        <>
          <p className="font-display text-lg font-bold">{data.headline}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm marker:text-pink">{data.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          <p className="mt-3 text-xs text-muted-foreground">{data.source === 'ai' ? 'Written by AI from this week\'s totals (no student names are shared).' : 'Computed summary (AI unavailable or limit reached).'}</p>
        </>
      )}
    </Card>
  )
}

export default function AdminDashboard() {
  const { data: d, loading, error, reload } = useData<Dash>('/admin/dashboard')
  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !d) return <ErrorState message={error || 'Could not load the dashboard'} onRetry={reload} />

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Today · ${d.today.date}${d.today.isWorkingDay ? '' : ' (not a working day)'}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active students" value={d.counts.students} hint={`${d.counts.batches} active batches`} />
        <StatCard label="Staff" value={d.counts.staff} hint={`${d.today.staffPresent} present today`} tone="blue" />
        <StatCard label="Today's attendance" value={d.today.studentAttendancePercent === null ? '—' : `${d.today.studentAttendancePercent}%`} hint={`${d.today.studentsMarked} students marked`} tone="green" />
        <StatCard label="New enquiries" value={d.counts.newEnquiries} tone="purple" hint="from the website" />
        <StatCard label="Pending leaves" value={d.counts.pendingLeaves} tone="amber" hint="awaiting review" />
        <StatCard label="Collected (month)" value={money(d.fees.collectedThisMonth)} hint={`${money(d.fees.collectedTotal)} all time`} tone="green" />
        <StatCard label="Pending fees" value={money(d.fees.pending.amount)} hint={`${d.fees.pending.count} instalments`} tone="blue" />
        <StatCard label="Overdue" value={money(d.fees.overdue.amount)} hint={`${d.fees.overdue.count} instalments`} tone="red" />
        <StatCard label="Due today" value={money(d.fees.dueToday.amount)} hint={`${d.fees.dueToday.count} instalments`} tone="amber" />
      </div>

      <InsightsCard />

      <Card title="Student attendance trend (last 14 days)" className="mt-5">
        <TrendChart data={d.trend} />
        <p className="mt-2 text-xs text-muted-foreground">Percentage of students present or late on each school day, across all batches.</p>
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title={`Low attendance (below ${d.lowAttendance.threshold}%, last 30 days)`} actions={<Link className="text-xs text-purple hover:underline" href="/admin/reports">Full report</Link>}>
          {d.lowAttendance.students.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No students below the threshold</p> : (
            <ul className="divide-y text-sm">
              {d.lowAttendance.students.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span><span className="font-medium">{s.name}</span> <span className="text-xs text-muted-foreground">{s.admissionNo} · {s.batch || 'no batch'}</span></span>
                  <span className="font-semibold text-red-600">{s.percentage}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent activity" actions={<Link className="text-xs text-purple hover:underline" href="/admin/audit">Audit log</Link>}>
          {d.recentActivity.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p> : (
            <ul className="divide-y text-sm">
              {d.recentActivity.map((a) => (
                <li key={a._id} className="flex flex-wrap items-center justify-between gap-1 py-2">
                  <span><span className="font-medium">{a.actorName || 'System'}</span> · {a.action.replace(/_/g, ' ').toLowerCase()} <StatusBadge value={a.entity.toUpperCase().slice(0, 12)} /></span>
                  <span className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
