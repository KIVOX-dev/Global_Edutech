'use client'

import { useEffect, useState } from 'react'
import { Loader2, Play, Save, Send } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, ErrorState, FilterSelect, PageHeader, Spinner, StatusBadge, btn, inputCls } from '@/components/portal/kit'
import { api, fmtDateTime, money, fmtDate } from '@/lib/portal/api'
import { notifyError, notifyOk, useData, useList } from '@/lib/portal/hooks'

type Tpl = { subject: string; html: string }
type RS = {
  enabled: boolean; daysBefore: number[]; onDueDate: boolean; overdueEveryDays: number; overdueMaxCount: number; sendTime: string; sendToParent: boolean
  templates: { beforeDue: Tpl; dueToday: Tpl; overdue: Tpl }
}
type Log = { _id: string; rule: string; status: string; provider?: string; error?: string; sentAt?: string; dateKey: string; createdAt: string; recipients?: string[]; student?: { name: string }; studentFee?: { installmentLabel: string; amountDue: number; dueDate: string } }

const PLACEHOLDERS = '{student_name} {parent_name} {amount_due} {due_date} {course} {institute_name} {payment_instructions}'

export default function RemindersPage() {
  const { data, loading, error, reload } = useData<RS>('/admin/reminders/settings')
  const [form, setForm] = useState<RS | null>(null)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [bulk, setBulk] = useState(false)
  useEffect(() => { if (data) setForm(structuredClone(data)) }, [data])

  const logsState = { status: '', provider: '', from: '', to: '' }
  const [lf, setLf] = useState(logsState)
  const [page, setPage] = useState(1)
  const logs = useList<Log>('/admin/reminders/logs', { page, limit: 15, ...lf })

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !form) return <ErrorState message={error || 'Could not load settings'} onRetry={reload} />

  const set = <K extends keyof RS>(k: K, v: RS[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const setTpl = (k: keyof RS['templates'], field: keyof Tpl, v: string) => setForm((f) => (f ? { ...f, templates: { ...f.templates, [k]: { ...f.templates[k], [field]: v } } } : f))

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/admin/reminders/settings', form)
      notifyOk('Reminder settings saved')
      reload()
    } catch (e) { notifyError(e) } finally { setSaving(false) }
  }
  const run = async () => {
    setRunning(true)
    try {
      const { data: r } = await api.post<{ ran: boolean; reason?: string; sent?: number; failed?: number; skipped?: number; newlyOverdue?: number }>('/admin/reminders/run', undefined, { force: true })
      if (r.ran) notifyOk('Reminder run finished', `${r.sent} sent, ${r.failed} failed, ${r.skipped} skipped, ${r.newlyOverdue} newly overdue`)
      else notifyOk('Reminder run did not start', r.reason)
      logs.reload()
    } catch (e) { notifyError(e) } finally { setRunning(false) }
  }

  const columns: Column<Log>[] = [
    { key: 'createdAt', header: 'When', sortable: true, render: (l) => fmtDateTime(l.createdAt) },
    { key: 'student', header: 'Student', value: (l) => l.student?.name, render: (l) => <span><span className="font-medium">{l.student?.name}</span><br /><span className="text-xs text-muted-foreground">{l.studentFee?.installmentLabel} · {money(l.studentFee?.amountDue)} · due {fmtDate(l.studentFee?.dueDate)}</span></span> },
    { key: 'rule', header: 'Rule', render: (l) => l.rule },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge value={l.status} /> },
    { key: 'provider', header: 'Provider', mobileHidden: true },
    { key: 'error', header: 'Detail', mobileHidden: true, render: (l) => <span className="text-xs text-red-700">{l.error || (l.recipients ? l.recipients.join(', ') : '')}</span> },
  ]

  return (
    <>
      <PageHeader title="Fee reminders" subtitle="Automatic emails to students and parents before and after the due date"
        actions={<>
          <button className={btn('outline')} onClick={() => setBulk(true)}><Send className="h-4 w-4" /> Send to all overdue</button>
          <button className={btn('outline')} onClick={run} disabled={running}>{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run daily job now</button>
        </>} />

      <Card title="Schedule & rules" actions={<button className={btn('primary', 'sm')} onClick={save} disabled={saving}><Save className="h-4 w-4" /> Save</button>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-purple" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Automatic reminders enabled</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-purple" checked={form.sendToParent} onChange={(e) => set('sendToParent', e.target.checked)} /> Also email the parent</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-purple" checked={form.onDueDate} onChange={(e) => set('onDueDate', e.target.checked)} /> Remind on the due date</label>
          <label className="font-medium">Send time (IST)<input type="time" className={`${inputCls} mt-1`} value={form.sendTime} onChange={(e) => set('sendTime', e.target.value)} /></label>
          <label className="font-medium">Days before due<input className={`${inputCls} mt-1`} value={form.daysBefore.join(', ')} onChange={(e) => set('daysBefore', e.target.value.split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n > 0))} /><span className="text-xs font-normal text-muted-foreground">e.g. 7, 3, 1</span></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="font-medium">Overdue every (days)<input type="number" min={1} className={`${inputCls} mt-1`} value={form.overdueEveryDays} onChange={(e) => set('overdueEveryDays', Number(e.target.value))} /></label>
            <label className="font-medium">Max overdue emails<input type="number" min={0} className={`${inputCls} mt-1`} value={form.overdueMaxCount} onChange={(e) => set('overdueMaxCount', Number(e.target.value))} /></label>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {([['beforeDue', 'Before due date'], ['dueToday', 'Due today'], ['overdue', 'Overdue']] as const).map(([k, title]) => (
          <Card key={k} title={`Template: ${title}`}>
            <label className="block text-sm font-medium">Subject<input className={`${inputCls} mt-1`} value={form.templates[k].subject} onChange={(e) => setTpl(k, 'subject', e.target.value)} /></label>
            <label className="mt-3 block text-sm font-medium">Body (HTML)<textarea className="mt-1 h-44 w-full rounded-lg border p-2 font-mono text-xs" value={form.templates[k].html} onChange={(e) => setTpl(k, 'html', e.target.value)} /></label>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Placeholders: <code>{PLACEHOLDERS}</code>. Values are HTML-escaped automatically. Save to apply.</p>

      <Card title="Reminder log" className="mt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <FilterSelect label="Any status" value={lf.status} onChange={(v) => { setLf({ ...lf, status: v }); setPage(1) }} options={['SENT', 'FAILED', 'SKIPPED', 'PENDING'].map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="Any provider" value={lf.provider} onChange={(v) => { setLf({ ...lf, provider: v }); setPage(1) }} options={[{ value: 'BREVO', label: 'Brevo' }]} />
          <input type="date" className={`${inputCls} sm:w-auto`} value={lf.from} onChange={(e) => { setLf({ ...lf, from: e.target.value }); setPage(1) }} aria-label="From" />
          <input type="date" className={`${inputCls} sm:w-auto`} value={lf.to} onChange={(e) => { setLf({ ...lf, to: e.target.value }); setPage(1) }} aria-label="To" />
        </div>
        <DataTable columns={columns} rows={logs.rows} meta={logs.meta} loading={logs.loading} error={logs.error} onRetry={logs.reload} onPage={setPage} exportName="reminder-log" emptyTitle="No reminders sent yet" />
      </Card>

      <ConfirmDialog open={bulk} danger={false} confirmLabel="Send now" title="Send to all overdue" message="Email every student/parent with an overdue instalment right now? Each fee gets at most one bulk email per day."
        onClose={() => setBulk(false)}
        onConfirm={async () => { try { const { data: r } = await api.post<{ total: number; sent: number; failed: number; skipped: number }>('/admin/reminders/send-overdue'); notifyOk('Bulk reminders done', `${r.sent} sent, ${r.failed} failed, ${r.skipped} skipped of ${r.total}`); setBulk(false); logs.reload() } catch (e) { notifyError(e); setBulk(false) } }} />
    </>
  )
}
