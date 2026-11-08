'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { Card, ErrorState, PageHeader, Spinner, StatCard, StatusBadge, btn } from '@/components/portal/kit'
import { api, fmtDate, fmtTime } from '@/lib/portal/api'
import { notifyError, notifyOk, useData } from '@/lib/portal/hooks'
import { useAuth } from '@/lib/portal/auth'

type Dash = {
  date: string; isWorkingDay: boolean; reason: string | null; batchCount: number; studentCount: number
  pendingAttendance: { id: string; name: string }[]
  todayAttendance: { status: string; checkIn?: string; checkOut?: string; totalMinutes?: number } | null
  leaveBalance?: { casual: number; sick: number }; shift: { start: string; end: string } | null; pendingLeaves: number
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const { data: d, loading, error, reload } = useData<Dash>('/staff/dashboard')
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !d) return <ErrorState message={error || 'Could not load the dashboard'} onRetry={reload} />

  const act = async (path: string, msg: string) => {
    setBusy(true)
    try { await api.post(path); notifyOk(msg); reload() } catch (e) { notifyError(e) } finally { setBusy(false) }
  }
  const t = d.todayAttendance

  return (
    <>
      <PageHeader title={`Hello, ${user?.name.split(' ')[0] || ''}`} subtitle={`${fmtDate(d.date)}${d.shift ? ` · shift ${d.shift.start}–${d.shift.end}` : ''}`} />

      <Card title="Today's attendance">
        {!d.isWorkingDay ? <p className="text-sm text-muted-foreground">{d.reason}. No check-in needed today.</p> : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {t ? <p><StatusBadge value={t.status} /> <span className="ml-2">In {fmtTime(t.checkIn)}{t.checkOut ? ` · Out ${fmtTime(t.checkOut)} · ${((t.totalMinutes || 0) / 60).toFixed(1)} h` : ''}</span></p> : <p className="text-muted-foreground">You have not checked in yet.</p>}
            </div>
            <div className="flex gap-2">
              <button className={btn('success', 'lg')} disabled={busy || !!t?.checkIn || t?.status === 'ON_LEAVE'} onClick={() => act('/staff/attendance/check-in', 'Checked in')}><LogIn className="h-5 w-5" /> Check in</button>
              <button className={btn('outline', 'lg')} disabled={busy || !t?.checkIn || !!t?.checkOut} onClick={() => act('/staff/attendance/check-out', 'Checked out')}><LogOut className="h-5 w-5" /> Check out</button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="My batches" value={d.batchCount} />
        <StatCard label="My students" value={d.studentCount} tone="blue" />
        <StatCard label="Casual leave left" value={d.leaveBalance?.casual ?? '-'} tone="green" />
        <StatCard label="Sick leave left" value={d.leaveBalance?.sick ?? '-'} tone="amber" hint={d.pendingLeaves ? `${d.pendingLeaves} request(s) pending` : undefined} />
      </div>

      <Card title="Attendance to mark today" className="mt-4">
        {!d.isWorkingDay ? <p className="text-sm text-muted-foreground">Nothing to mark: {d.reason}.</p> : d.pendingAttendance.length === 0 ? <p className="text-sm text-emerald-700">All your batches are marked for today ✓</p> : (
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
