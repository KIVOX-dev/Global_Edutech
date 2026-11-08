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

const OPTIONS: { value: Status; short: string; label: string; on: string }[] = [
  { value: 'PRESENT', short: 'P', label: 'Present', on: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'ABSENT', short: 'A', label: 'Absent', on: 'bg-red-600 text-white border-red-600' },
  { value: 'LATE', short: 'L', label: 'Late', on: 'bg-amber-500 text-white border-amber-500' },
  { value: 'EXCUSED', short: 'E', label: 'Excused', on: 'bg-sky-600 text-white border-sky-600' },
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
    <div className="pb-28">
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
              <li key={s.id} className={cx('rounded-2xl border bg-card p-3', dirty.has(s.id) && 'ring-2 ring-purple/40')}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => set(s.id, current === 'PRESENT' ? 'ABSENT' : 'PRESENT')}
                  className="mb-2 flex w-full min-h-11 items-center justify-between text-left disabled:cursor-not-allowed"
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
                      className={cx('h-12 rounded-xl border text-sm font-semibold transition active:scale-95 disabled:opacity-50', current === o.value ? o.on : 'bg-background hover:bg-muted')}
                    >
                      <span className="sm:hidden">{o.short}</span><span className="hidden sm:inline">{o.label}</span>
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            P {counts.PRESENT} · A {counts.ABSENT} · L {counts.LATE} · E {counts.EXCUSED}{counts.unmarked ? ` · ${counts.unmarked} unmarked` : ''}
          </p>
          <div className="flex gap-2">
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
