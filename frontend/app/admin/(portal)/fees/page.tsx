'use client'

import { useState } from 'react'
import { BellRing, IndianRupee, Wand2 } from 'lucide-react'
import { Card, Column, DataTable, Field, FilterSelect, FormModal, Modal, PageHeader, SearchBox, StatCard, StatusBadge, btn, clean, inputCls } from '@/components/portal/kit'
import { api, fmtDate, money, todayIST } from '@/lib/portal/api'
import { notifyError, notifyOk, useData, useDebounced, useList } from '@/lib/portal/hooks'
import { useBatchOptions, useCourseOptions } from '@/lib/portal/options'

type Fee = {
  _id: string; student?: { _id: string; name: string; admissionNo: string }; course?: { name: string }; installmentLabel: string
  amountDue: number; amountPaid: number; balance: number; dueDate: string; status: string
}
type Dash = { collectedTotal: number; collectedThisMonth: number; pending: { amount: number; count: number }; overdue: { amount: number; count: number }; dueToday: { amount: number; count: number } }

export default function FeesPage() {
  const [tab, setTab] = useState<'fees' | 'structures'>('fees')
  return (
    <>
      <PageHeader title="Fees" subtitle="Instalments, payments and reminders" />
      <div className="mb-4 inline-flex rounded-xl border bg-card p-1" role="tablist">
        {([['fees', 'Student fees'], ['structures', 'Fee structures']] as const).map(([t, l]) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === t ? 'bg-purple text-white' : 'hover:bg-muted'}`}>{l}</button>
        ))}
      </div>
      {tab === 'fees' ? <FeeList /> : <Structures />}
    </>
  )
}

function FeeList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [batch, setBatch] = useState('')
  const [course, setCourse] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Fee>('/admin/fees', { page, limit: 15, search: q, status, batch, course, from, to })
  const { data: dash, reload: reloadDash } = useData<Dash>('/admin/fees/dashboard')
  const batches = useBatchOptions()
  const courses = useCourseOptions()
  const [pay, setPay] = useState<Fee | null>(null)
  const [gen, setGen] = useState(false)
  const refresh = () => { reload(); reloadDash() }

  const remind = async (f: Fee) => {
    try {
      const { data } = await api.post<{ status: string; reason?: string }>(`/admin/reminders/send/${f._id}`)
      notifyOk(data.status === 'SENT' ? 'Reminder sent' : `Reminder ${data.status.toLowerCase()}`, data.reason)
    } catch (e) { notifyError(e) }
  }

  const columns: Column<Fee>[] = [
    { key: 'student', header: 'Student', sortable: true, value: (f) => f.student?.name, render: (f) => <span><span className="font-medium">{f.student?.name}</span><br /><span className="text-xs text-muted-foreground">{f.student?.admissionNo}</span></span> },
    { key: 'installmentLabel', header: 'Instalment', mobileHidden: true, render: (f) => <span>{f.installmentLabel}<br /><span className="text-xs text-muted-foreground">{f.course?.name}</span></span> },
    { key: 'dueDate', header: 'Due', sortable: true, render: (f) => fmtDate(f.dueDate) },
    { key: 'amountDue', header: 'Amount', sortable: true, render: (f) => money(f.amountDue) },
    { key: 'amountPaid', header: 'Paid', mobileHidden: true, render: (f) => money(f.amountPaid) },
    { key: 'balance', header: 'Balance', sortable: true, render: (f) => <span className="font-semibold">{money(f.balance)}</span> },
    { key: 'status', header: 'Status', render: (f) => <StatusBadge value={f.status} /> },
    {
      key: 'a', header: '', className: 'text-right whitespace-nowrap', render: (f) => f.status === 'PAID' ? null : (
        <div className="flex justify-end gap-1">
          <button className={btn('primary', 'sm')} onClick={() => setPay(f)}><IndianRupee className="h-4 w-4" /> Pay</button>
          <button className={btn('outline', 'sm')} onClick={() => remind(f)} title="Send reminder now"><BellRing className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <>
      {dash && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Collected (month)" value={money(dash.collectedThisMonth)} tone="green" />
          <StatCard label="Pending" value={money(dash.pending.amount)} hint={`${dash.pending.count} instalments`} tone="blue" />
          <StatCard label="Overdue" value={money(dash.overdue.amount)} hint={`${dash.overdue.count} instalments`} tone="red" />
          <StatCard label="Due today" value={money(dash.dueToday.amount)} hint={`${dash.dueToday.count} instalments`} tone="amber" />
        </div>
      )}
      <Card actions={<button className={btn('primary', 'sm')} onClick={() => setGen(true)}><Wand2 className="h-4 w-4" /> Generate fees</button>}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Student name or admission no…" />
          <FilterSelect label="Any status" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'].map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="All batches" value={batch} onChange={(v) => { setBatch(v); setPage(1) }} options={batches} />
          <FilterSelect label="All courses" value={course} onChange={(v) => { setCourse(v); setPage(1) }} options={courses} />
          <input type="date" className={`${inputCls} sm:w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="Due from" />
          <input type="date" className={`${inputCls} sm:w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="Due to" />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="fees" emptyTitle="No fees found" emptyHint="Use “Generate fees” to create instalments from a course." />
      </Card>

      <FormModal open={!!pay} title={`Record payment: ${pay?.student?.name}`} submitLabel="Record payment"
        fields={[
          { name: 'amount', label: `Amount (balance ${money(pay?.balance)})`, type: 'number', required: true, half: true },
          { name: 'mode', label: 'Mode', type: 'select', required: true, half: true, options: ['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE'].map((v) => ({ value: v, label: v })) },
          { name: 'paidOn', label: 'Paid on', type: 'date', half: true },
          { name: 'reference', label: 'Reference / UTR', half: true },
        ]}
        initial={pay ? { amount: pay.balance, mode: 'CASH', paidOn: todayIST() } : undefined}
        onSubmit={async (v) => { await api.post(`/admin/fees/${pay!._id}/payments`, clean(v, ['amount'])); notifyOk('Payment recorded'); refresh() }}
        onClose={() => setPay(null)} />
      {gen && <GenerateModal onClose={() => setGen(false)} onDone={refresh} />}
    </>
  )
}

type StudentHit = { _id: string; name: string; admissionNo: string }
function GenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const batches = useBatchOptions()
  const [scope, setScope] = useState<'batch' | 'student'>('batch')
  const [batch, setBatch] = useState('')
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<StudentHit | null>(null)
  const [start, setStart] = useState(todayIST())
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const q = useDebounced(search)
  const hits = useList<StudentHit>('/admin/students', { limit: 6, search: q, status: 'ACTIVE' }, scope === 'student' && q.length > 1)

  const run = async () => {
    setBusy(true)
    try {
      const body = scope === 'batch' ? { batchId: batch, startDate: start } : { studentId: student?._id, startDate: start }
      const { data } = await api.post<{ created: number; skipped: number; problems: { student: string; error: string }[] }>('/admin/fees/generate', body)
      setResult(`${data.created} instalment(s) created, ${data.skipped} already existed.${data.problems.length ? ` Problems: ${data.problems.map((p) => `${p.student} (${p.error})`).join('; ')}` : ''}`)
      onDone()
    } catch (e) { notifyError(e) } finally { setBusy(false) }
  }
  return (
    <Modal open title="Generate fees from course instalments" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="inline-flex rounded-lg border p-0.5">
          {(['batch', 'student'] as const).map((s) => <button key={s} onClick={() => setScope(s)} className={`rounded-md px-3 py-1 capitalize ${scope === s ? 'bg-purple text-white' : ''}`}>{s === 'batch' ? 'Whole batch' : 'One student'}</button>)}
        </div>
        {scope === 'batch' ? (
          <FilterSelect label="Select batch" value={batch} onChange={setBatch} options={batches} />
        ) : (
          <div>
            <SearchBox value={search} onChange={(v) => { setSearch(v); setStudent(null) }} placeholder="Search student…" />
            <ul className="mt-2 space-y-1">
              {hits.rows.map((s) => <li key={s._id}><button className={`w-full rounded-lg px-3 py-2 text-left hover:bg-muted ${student?._id === s._id ? 'bg-purple/10 font-medium' : ''}`} onClick={() => setStudent(s)}>{s.name} <span className="text-xs text-muted-foreground">{s.admissionNo}</span></button></li>)}
            </ul>
          </div>
        )}
        <label className="block font-medium">First instalment date
          <input type="date" className={`${inputCls} mt-1`} value={start} onChange={(e) => setStart(e.target.value)} />
          <span className="text-xs font-normal text-muted-foreground">Each due date = this date + the instalment's day offset. Running it twice never duplicates.</span>
        </label>
        {result && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">{result}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className={btn('ghost')} onClick={onClose}>Close</button>
        <button className={btn('primary')} disabled={busy || (scope === 'batch' ? !batch : !student)} onClick={run}>Generate</button>
      </div>
    </Modal>
  )
}

type CourseFee = {
  _id: string; name: string; code: string; durationMonths: number; startDate?: string; endDate?: string; classDays?: number[]
  totalFee: number; installments: { label: string; amount: number; dueOffsetDays: number }[]
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Every course added under Courses & Batches shows up here with the same details; the fee plan is edited here
function Structures() {
  const [page, setPage] = useState(1)
  const { rows, meta, loading, error, reload } = useList<CourseFee>('/admin/courses', { page, limit: 15 })
  const [edit, setEdit] = useState<CourseFee | null>(null)
  const columns: Column<CourseFee>[] = [
    { key: 'name', header: 'Course', sortable: true, render: (c) => <span className="font-medium">{c.name} <span className="text-xs text-muted-foreground">({c.code})</span></span> },
    { key: 'duration', header: 'Duration', render: (c) => (c.startDate && c.endDate ? `${fmtDate(c.startDate)} to ${fmtDate(c.endDate)}` : `${c.durationMonths} months`) },
    { key: 'days', header: 'Class days', mobileHidden: true, render: (c) => (c.classDays?.length ? [...c.classDays].sort().map((d) => DAY_NAMES[d]).join(' ') : '-') },
    { key: 'totalFee', header: 'Total fee', sortable: true, render: (c) => (c.totalFee ? money(c.totalFee) : <span className="text-muted-foreground">Not set</span>) },
    { key: 'installments', header: 'Instalments', render: (c) => (c.installments.length ? c.installments.map((i) => `${i.label}: ${money(i.amount)}`).join(' · ') : <span className="text-muted-foreground">None</span>) },
    { key: 'a', header: '', className: 'text-right whitespace-nowrap', render: (c) => <button className={btn('outline', 'sm')} onClick={() => setEdit(c)}>Edit fees</button> },
  ]
  const text = (c: CourseFee | null) => (c?.installments || []).map((i) => `${i.label}, ${i.amount}, ${i.dueOffsetDays}`).join('\n')
  return (
    <Card>
      <p className="mb-3 text-sm text-muted-foreground">Courses come from Courses &amp; Batches. Add or change a course there; set its fee plan here.</p>
      <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} emptyTitle="No courses yet" emptyHint="Add a course under Courses & Batches and it appears here." />
      <FormModal open={!!edit} title={`Fee plan: ${edit?.name || ''}`} submitLabel="Save fee plan"
        fields={[{ name: 'installments', label: 'Instalments', type: 'textarea', required: true, help: 'One per line: label, amount, due-offset-days (days after the fee start date). Example: Instalment 1, 6000, 0. The total is the sum.' }]}
        initial={{ installments: text(edit) }} onClose={() => setEdit(null)}
        onSubmit={async (v) => {
          const installments = String(v.installments).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
            const [label, amount, off] = l.split(',').map((x) => x.trim())
            if (!label || Number.isNaN(Number(amount))) throw new Error(`Invalid line: "${l}"`)
            return { label, amount: Number(amount), dueOffsetDays: Number(off || 0) }
          })
          await api.patch(`/admin/courses/${edit!._id}`, { installments, totalFee: installments.reduce((a, i) => a + i.amount, 0) })
          notifyOk('Fee plan saved')
          reload()
        }} />
    </Card>
  )
}
