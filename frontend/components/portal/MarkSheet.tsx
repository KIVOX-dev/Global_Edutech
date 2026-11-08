'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCheck, Loader2, Lock, Save } from 'lucide-react'
import { api, todayIST } from '@/lib/portal/api'
import { notifyError, notifyOk, useData } from '@/lib/portal/hooks'
import { ErrorState, Spinner, btn, cx } from './kit'

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
type Roster = {
  batch: { id: string; name: string }
  date: string
  isWorkingDay: boolean
  reason: string | null
  isFuture: boolean
  students: { id: string; name: string; admissionNo: string; attendance: { id: string; status: Status; locked: boolean } | null }[]
}

const OPTIONS: { value: Status; short: string; label: string; icon: string; on: string; off: string; card: string }[] = [
  { value: 'PRESENT', short: 'P', label: 'Present', icon: '✓', on: 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/40 scale-[1.03]', off: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', card: 'border-l-emerald-500 bg-emerald-50/50' },
  { value: 'ABSENT', short: 'A', label: 'Absent', icon: '✕', on: 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/40 scale-[1.03]', off: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', card: 'border-l-red-500 bg-red-50/50' },
  { value: 'LATE', short: 'L', label: 'Late', icon: '⏰', on: 'bg-amber-400 text-amber-950 border-amber-500 shadow-md shadow-amber-400/50 scale-[1.03]', off: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', card: 'border-l-amber-400 bg-amber-50/50' },
  { value: 'EXCUSED', short: 'E', label: 'Excused', icon: '✉', on: 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/40 scale-[1.03]', off: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100', card: 'border-l-sky-500 bg-sky-50/50' },
]

// Mobile-first attendance sheet: big tap targets, tap a name to flip Present/Absent, sticky save bar
export default function MarkSheet({ batchId, date }: { batchId: string; date: string }) {
  const { data, loading, error, reload } = useData<Roster>(`/attendance/batch/${batchId}`, { date })
  const [marks, setMarks] = useState<Record<string, Status>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    const m: Record<string, Status> = {}
    data.students.forEach((s) => { if (s.attendance) m[s.id] = s.attendance.status })
    setMarks(m)
    setDirty(new Set())
  }, [data])

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, unmarked: 0 }
    data?.students.forEach((s) => { const st = marks[s.id]; if (st) c[st] += 1; else c.unmarked += 1 })
    return c
  }, [data, marks])

  if (loading) return <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
  if (error || !data) return <ErrorState message={error || 'Could not load the roster'} onRetry={reload} />

  const blocked = !data.isWorkingDay || data.isFuture || date > todayIST()
  const set = (id: string, st: Status) => {
    setMarks((m) => ({ ...m, [id]: st }))
    setDirty((d) => new Set(d).add(id))
  }
  const allPresent = () => {
    data.students.forEach((s) => { if (!s.attendance?.locked && marks[s.id] !== 'PRESENT') set(s.id, 'PRESENT') })
  }

  const save = async () => {
    setSaving(true)
    try {
      const entries = Array.from(dirty).map((studentId) => ({ studentId, status: marks[studentId] }))
      const { data: r } = await api.post<{ saved: number; locked: string[] }>(`/attendance/batch/${batchId}`, { date, entries })
      notifyOk('Attendance saved', `${r.saved} record${r.saved === 1 ? '' : 's'} updated${r.locked.length ? `, ${r.locked.length} locked (edit window closed)` : ''}`)
      reload()
    } catch (e) {
      notifyError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-24">
      {blocked && (
        <div role="status" className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {data.reason || (data.isFuture ? 'Attendance cannot be marked for a future date.' : 'Attendance is not available for this date.')}
        </div>
      )}
      {data.students.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No active students in this batch.</p>
      ) : (
        <ul className="space-y-2">
          {data.students.map((s) => {
            const locked = !!s.attendance?.locked
            const disabled = blocked || locked
            const current = marks[s.id]
            return (
              <li key={s.id} className={cx('rounded-2xl border border-l-4 p-3 transition-colors', current ? OPTIONS.find((o) => o.value === current)?.card : 'border-l-gray-300 bg-card', dirty.has(s.id) && 'ring-2 ring-purple/40')}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => set(s.id, current === 'PRESENT' ? 'ABSENT' : 'PRESENT')}
                  className="mb-2 flex min-h-12 w-full items-center justify-between text-left disabled:cursor-not-allowed"
                  aria-label={`Toggle ${s.name} between present and absent`}
                >
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.admissionNo}</span>
                  </span>
                  {locked && <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />}
                </button>
                <div className="grid grid-cols-4 gap-2" role="group" aria-label={`Status for ${s.name}`}>
                  {OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      disabled={disabled}
                      aria-pressed={current === o.value}
                      onClick={() => set(s.id, o.value)}
                      className={cx('flex h-14 flex-col items-center justify-center rounded-xl border-2 text-sm font-bold leading-tight transition active:scale-95 disabled:opacity-50', current === o.value ? o.on : o.off)}
                    >
                      <span aria-hidden className="text-base leading-none">{o.icon}</span><span className="text-[11px]">{o.label}</span>
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="mr-2 font-semibold text-emerald-600">✓ {counts.PRESENT}</span><span className="mr-2 font-semibold text-red-600">✕ {counts.ABSENT}</span><span className="mr-2 font-semibold text-amber-600">⏰ {counts.LATE}</span><span className="mr-2 font-semibold text-sky-600">✉ {counts.EXCUSED}</span>{counts.unmarked ? <span>· {counts.unmarked} unmarked</span> : null}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button className={btn('outline')} disabled={blocked || saving || data.students.length === 0} onClick={allPresent}><CheckCheck className="h-4 w-4" /> All present</button>
            <button className={btn('primary')} disabled={blocked || saving || dirty.size === 0} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save{dirty.size ? ` (${dirty.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
