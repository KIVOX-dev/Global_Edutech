'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Save, XCircle } from 'lucide-react'
import { Card, ErrorState, PageHeader, Spinner, btn, inputCls } from '@/components/portal/kit'
import { api } from '@/lib/portal/api'
import { notifyError, notifyOk, useData } from '@/lib/portal/hooks'

type Settings = {
  academicYear: string; workingDays: number[]; attendanceCutoffTime: string; lowAttendanceThreshold: number
  staffEditWindowHours: number; staffLateGraceMinutes: number; staffCanViewFees: boolean
}
type Status = { environment: string; timezone: string; integrations: Record<string, boolean>; placeholderMode: boolean; notConfigured: string[] }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LABELS: Record<string, string> = { mongodb: 'MongoDB Atlas', b2: 'Backblaze B2 storage', brevo: 'Brevo email', groq: 'Groq AI (optional, has built-in fallbacks)', jwtSecrets: 'JWT secrets' }

export default function SettingsPage() {
  const { data, loading, error, reload } = useData<Settings>('/admin/settings')
  const sys = useData<Status>('/admin/system/status')
  const [form, setForm] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setForm({ ...data }) }, [data])

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !form) return <ErrorState message={error || 'Could not load settings'} onRetry={reload} />
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const save = async () => {
    setSaving(true)
    try { await api.patch('/admin/settings', form); notifyOk('Settings saved'); reload() } catch (e) { notifyError(e) } finally { setSaving(false) }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Academic and attendance rules" actions={<button className={btn('primary')} onClick={save} disabled={saving}><Save className="h-4 w-4" /> Save changes</button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Attendance rules">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <label className="font-medium">Academic year<input className={`${inputCls} mt-1`} value={form.academicYear} onChange={(e) => set('academicYear', e.target.value)} /></label>
            <label className="font-medium">Staff cut-off time (today)<input type="time" className={`${inputCls} mt-1`} value={form.attendanceCutoffTime} onChange={(e) => set('attendanceCutoffTime', e.target.value)} /></label>
            <label className="font-medium">Low attendance threshold (%)<input type="number" min={0} max={100} className={`${inputCls} mt-1`} value={form.lowAttendanceThreshold} onChange={(e) => set('lowAttendanceThreshold', Number(e.target.value))} /></label>
            <label className="font-medium">Staff edit window (hours)<input type="number" min={0} className={`${inputCls} mt-1`} value={form.staffEditWindowHours} onChange={(e) => set('staffEditWindowHours', Number(e.target.value))} /></label>
            <label className="font-medium">Staff late grace (minutes)<input type="number" min={0} className={`${inputCls} mt-1`} value={form.staffLateGraceMinutes} onChange={(e) => set('staffLateGraceMinutes', Number(e.target.value))} /></label>
            <label className="flex items-center gap-2 self-end pb-2"><input type="checkbox" className="h-4 w-4 accent-purple" checked={form.staffCanViewFees} onChange={(e) => set('staffCanViewFees', e.target.checked)} /> Staff can view fees (read-only)</label>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Working days</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <button key={d} type="button" aria-pressed={form.workingDays.includes(i)} onClick={() => set('workingDays', form.workingDays.includes(i) ? form.workingDays.filter((x) => x !== i) : [...form.workingDays, i].sort())}
                  className={`h-10 min-w-12 rounded-xl border px-3 text-sm font-medium ${form.workingDays.includes(i) ? 'border-purple bg-purple text-white' : 'hover:bg-muted'}`}>{d}</button>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card title="System status">
          {sys.loading ? <Spinner /> : sys.error || !sys.data ? <ErrorState message={sys.error || 'Unavailable'} onRetry={sys.reload} /> : (
            <>
              <ul className="divide-y text-sm">
                {Object.entries(sys.data.integrations).filter(([k]) => LABELS[k]).map(([k, ok]) => (
                  <li key={k} className="flex items-center justify-between py-2">
                    <span>{LABELS[k]}</span>
                    {ok ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Configured</span> : <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" /> Not configured</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Environment: {sys.data.environment} · Timezone: {sys.data.timezone}. Values are set as environment variables on the server and are never shown here.</p>
              {sys.data.placeholderMode && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Placeholder mode: unconfigured services are skipped (no emails, no file storage calls).</p>}
            </>
          )}
        </Card>
      </div>
    </>
  )
}
