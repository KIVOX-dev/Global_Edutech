'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, Field, FormModal, Modal, PageHeader, SearchBox, StatusBadge, btn, clean, inputCls } from '@/components/portal/kit'
import { api, errorMessage, fmtDate, money } from '@/lib/portal/api'
import FancySelect from '@/components/forms/FancySelect'
import { notifyError, notifyOk, useDebounced, useList } from '@/lib/portal/hooks'
import { useCourseOptions, useStaffOptions } from '@/lib/portal/options'

type Installment = { label: string; amount: number; dueOffsetDays: number }
type Course = { _id: string; name: string; code: string; durationMonths: number; startDate?: string; endDate?: string; classDays?: number[]; totalFee: number; installments: Installment[] }
type Batch = { _id: string; name: string; course?: { _id: string; name: string }; startDate?: string; endDate?: string; timings?: string; isActive: boolean; staff: { _id: string; name: string }[]; studentCount: number }

const instToText = (i: Installment[] = []) => i.map((x) => `${x.label}, ${x.amount}, ${x.dueOffsetDays}`).join('\n')
function textToInst(t: string): Installment[] {
  return t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label, amount, off] = l.split(',').map((p) => p.trim())
    if (!label || Number.isNaN(Number(amount))) throw new Error(`Invalid instalment line: "${l}". Use: label, amount, due-offset-days`)
    return { label, amount: Number(amount), dueOffsetDays: Number(off || 0) }
  })
}

export default function CoursesPage() {
  const [tab, setTab] = useState<'courses' | 'batches'>('courses')
  return (
    <>
      <PageHeader title="Courses & Batches" subtitle="Define what you teach, fee instalments and who teaches which batch" />
      <div className="mb-4 inline-flex rounded-xl border bg-card p-1" role="tablist">
        {(['courses', 'batches'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? 'bg-purple text-white' : 'hover:bg-muted'}`}>{t}</button>
        ))}
      </div>
      {tab === 'courses' ? <Courses /> : <Batches />}
    </>
  )
}

function Courses() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Course>('/admin/courses', { page, limit: 15, search: q })
  const [edit, setEdit] = useState<Course | 'new' | null>(null)
  const [del, setDel] = useState<Course | null>(null)

  const columns: Column<Course>[] = [
    { key: 'code', header: 'Code', sortable: true },
    { key: 'name', header: 'Course', sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'durationMonths', header: 'Duration', mobileHidden: true, render: (c) => (c.startDate && c.endDate ? `${fmtDate(c.startDate)} to ${fmtDate(c.endDate)}` : `${c.durationMonths} mo`) },
    { key: 'classDays', header: 'Days', mobileHidden: true, render: (c) => (c.classDays?.length ? [...c.classDays].sort().map((d) => DAYS[d]).join(' ') : '-') },
    { key: 'totalFee', header: 'Total fee', value: (c) => c.totalFee, render: (c) => money(c.totalFee) },
    { key: 'installments', header: 'Instalments', mobileHidden: true, render: (c) => c.installments.length },
    {
      key: 'a', header: '', className: 'text-right', render: (c) => (
        <div className="flex justify-end gap-1">
          <button className={btn('ghost', 'sm')} onClick={() => setEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} onClick={() => setDel(c)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
        </div>
      ),
    },
  ]
  return (
    <Card actions={<button className={btn('primary', 'sm')} onClick={() => setEdit('new')}><Plus className="h-4 w-4" /> Add course</button>}>
      <div className="mb-3"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search courses…" /></div>
      <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="courses" emptyTitle="No courses yet" />
      {edit && <CourseModal course={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload() }} />}
      <ConfirmDialog open={!!del} title="Delete course" message={`Delete ${del?.name}? Courses used by students, batches or fees cannot be deleted.`} onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/courses/${del!._id}`); notifyOk('Course deleted'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
    </Card>
  )
}

function Batches() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Batch>('/admin/batches', { page, limit: 15, search: q })
  const courses = useCourseOptions()
  const [edit, setEdit] = useState<Batch | 'new' | null>(null)
  const [del, setDel] = useState<Batch | null>(null)
  const [staffFor, setStaffFor] = useState<Batch | null>(null)
  const [studentsFor, setStudentsFor] = useState<Batch | null>(null)

  const columns: Column<Batch>[] = [
    { key: 'name', header: 'Batch', sortable: true, render: (b) => <span className="font-medium">{b.name}</span> },
    { key: 'course', header: 'Course', value: (b) => b.course?.name, render: (b) => b.course?.name },
    { key: 'timings', header: 'Timings', mobileHidden: true },
    { key: 'staff', header: 'Staff', mobileHidden: true, render: (b) => b.staff.map((s) => s.name).join(', ') || <span className="text-muted-foreground">None</span> },
    { key: 'studentCount', header: 'Students', sortable: true },
    { key: 'isActive', header: 'Status', render: (b) => <StatusBadge value={b.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'a', header: '', className: 'text-right whitespace-nowrap', render: (b) => (
        <div className="flex justify-end gap-1">
          <button className={btn('ghost', 'sm')} onClick={() => setStaffFor(b)} title="Assign staff"><UserPlus className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} onClick={() => setStudentsFor(b)} title="Assign students"><Users className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} onClick={() => setEdit(b)} title="Edit"><Pencil className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} onClick={() => setDel(b)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
        </div>
      ),
    },
  ]
  return (
    <Card actions={<button className={btn('primary', 'sm')} onClick={() => setEdit('new')}><Plus className="h-4 w-4" /> Add batch</button>}>
      <div className="mb-3"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search batches…" /></div>
      <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="batches" emptyTitle="No batches yet" />
      {edit && <BatchModal batch={edit === 'new' ? null : edit} courses={courses} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload() }} />}
      <ConfirmDialog open={!!del} title="Delete batch" message={`Delete ${del?.name}? Batches with attendance records cannot be deleted; mark them inactive.`} onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/batches/${del!._id}`); notifyOk('Batch deleted'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
      {staffFor && <AssignStaff batch={staffFor} onClose={() => { setStaffFor(null); reload() }} />}
      {studentsFor && <AssignStudents batch={studentsFor} onClose={() => { setStudentsFor(null); reload() }} />}
    </Card>
  )
}

function AssignStaff({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const options = useStaffOptions()
  const [sel, setSel] = useState<Set<string>>(new Set(batch.staff.map((s) => s._id)))
  const [busy, setBusy] = useState(false)
  return (
    <Modal open title={`Staff for ${batch.name}`} onClose={onClose}>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {options.map((o) => (
          <li key={o.value}><label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted">
            <input type="checkbox" className="h-4 w-4 accent-purple" checked={sel.has(o.value)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(o.value)) n.delete(o.value); else n.add(o.value); return n })} />{o.label}
          </label></li>
        ))}
        {options.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">Add staff first.</li>}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <button className={btn('ghost')} onClick={onClose}>Cancel</button>
        <button className={btn('primary')} disabled={busy} onClick={async () => { setBusy(true); try { await api.post(`/admin/batches/${batch._id}/assign-staff`, { staffIds: Array.from(sel) }); notifyOk('Staff assigned'); onClose() } catch (e) { notifyError(e) } finally { setBusy(false) } }}>Save</button>
      </div>
    </Modal>
  )
}

type StudentRow = { _id: string; name: string; admissionNo: string; batch?: { _id: string; name: string } }
function AssignStudents({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const q = useDebounced(search)
  const { rows, loading } = useList<StudentRow>('/admin/students', { limit: 50, search: q, status: 'ACTIVE' })
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [busy, setBusy] = useState(false)
  useEffect(() => setSel(new Set()), [mode])
  const visible = rows.filter((s) => (mode === 'remove' ? s.batch?._id === batch._id : s.batch?._id !== batch._id))
  return (
    <Modal open title={`Students in ${batch.name}`} onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border p-0.5 text-sm">
          {(['add', 'remove'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1 ${mode === m ? 'bg-purple text-white' : ''}`}>{m === 'add' ? 'Add students' : 'Remove students'}</button>)}
        </div>
        <SearchBox value={search} onChange={setSearch} placeholder="Find students…" />
      </div>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {loading && <li className="py-4 text-center text-sm text-muted-foreground">Loading…</li>}
        {visible.map((s) => (
          <li key={s._id}><label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted">
            <input type="checkbox" className="h-4 w-4 accent-purple" checked={sel.has(s._id)} onChange={() => setSel((x) => { const n = new Set(x); if (n.has(s._id)) n.delete(s._id); else n.add(s._id); return n })} />
            <span>{s.name} <span className="text-xs text-muted-foreground">{s.admissionNo}{s.batch && s.batch._id !== batch._id ? ` · currently in ${s.batch.name}` : ''}</span></span>
          </label></li>
        ))}
        {!loading && visible.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No students to show.</li>}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Currently {batch.studentCount} student(s). A student belongs to one batch; adding moves them here.</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className={btn('ghost')} onClick={onClose}>Close</button>
        <button className={btn(mode === 'remove' ? 'danger' : 'primary')} disabled={busy || sel.size === 0} onClick={async () => {
          setBusy(true)
          try { await api.post(`/admin/batches/${batch._id}/assign-students`, { studentIds: Array.from(sel), mode }); notifyOk(mode === 'add' ? 'Students added' : 'Students removed'); onClose() } catch (e) { notifyError(e) } finally { setBusy(false) }
        }}>{mode === 'add' ? 'Add' : 'Remove'} {sel.size || ''}</button>
      </div>
    </Modal>
  )
}

const toggle = (set: Set<string>, id: string) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n }

// One form for the batch details, its staff (who will see it under "My batches") and its students
function BatchModal({ batch, courses, onClose, onSaved }: { batch: Batch | null; courses: { value: string; label: string }[]; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ name: batch?.name || '', course: batch?.course?._id || '', startDate: (batch as any)?.startDate || '', endDate: (batch as any)?.endDate || '', timings: batch?.timings || '', isActive: batch ? batch.isActive : true })
  const set = (k: string, val: string | boolean) => setV((x) => ({ ...x, [k]: val }))
  const staffOpts = useStaffOptions()
  const [staffQ, setStaffQ] = useState('')
  const [staffSel, setStaffSel] = useState<Set<string>>(new Set((batch?.staff || []).map((s) => s._id)))
  const [stuQ, setStuQ] = useState('')
  const q = useDebounced(stuQ)
  const { rows, loading } = useList<StudentRow>('/admin/students', { limit: 50, search: q, status: 'ACTIVE' })
  const [stuSel, setStuSel] = useState<Set<string>>(new Set())
  const [stuNames, setStuNames] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const students = rows.filter((s) => s.batch?._id !== batch?._id)
  const staffShown = staffOpts.filter((o) => o.label.toLowerCase().includes(staffQ.trim().toLowerCase()))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!v.name.trim() || !v.course) { setErr('Batch name and course are required'); return }
    setBusy(true); setErr('')
    try {
      const body = clean({ name: v.name, course: v.course, startDate: v.startDate, endDate: v.endDate, timings: v.timings }) as Record<string, unknown>
      body.isActive = v.isActive
      const { data } = batch ? await api.patch<{ _id: string }>(`/admin/batches/${batch._id}`, body) : await api.post<{ _id: string }>('/admin/batches', body)
      await api.post(`/admin/batches/${data._id}/assign-staff`, { staffIds: Array.from(staffSel) })
      if (stuSel.size) await api.post(`/admin/batches/${data._id}/assign-students`, { studentIds: Array.from(stuSel), mode: 'add' })
      notifyOk('Batch saved', `${staffSel.size} staff, ${stuSel.size} student(s) assigned`)
      onSaved()
    } catch (e2) { setErr(errorMessage(e2)); setBusy(false) }
  }

  return (
    <Modal open title={batch ? 'Edit batch' : 'Add batch'} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Batch name <span className="text-red-600">*</span></span>
            <input className={inputCls} value={v.name} onChange={(e) => set('name', e.target.value)} required /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Course <span className="text-red-600">*</span></span>
            <FancySelect id="batch-course" label="Course" className={inputCls} value={v.course} onChange={(x) => set('course', x)} options={[{ value: '', label: 'Select…' }, ...courses]} required /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Start date</span><input type="date" className={inputCls} value={v.startDate} onChange={(e) => set('startDate', e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">End date</span><input type="date" className={inputCls} value={v.endDate} onChange={(e) => set('endDate', e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Timings</span><input className={inputCls} placeholder="9:00 - 10:30" value={v.timings} onChange={(e) => set('timings', e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm sm:pt-6"><input type="checkbox" className="h-4 w-4 accent-purple" checked={v.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
        </div>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Assign staff <span className="font-normal text-muted-foreground">({staffSel.size} selected). The batch appears under My batches in their login</span></h3>
          <SearchBox value={staffQ} onChange={setStaffQ} placeholder="Search staff…" />
          <ul className="mt-2 max-h-40 divide-y overflow-y-auto rounded-xl border">
            {staffShown.map((o) => (
              <li key={o.value}><label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 hover:bg-muted/50">
                <input type="checkbox" className="h-4 w-4 accent-purple" checked={staffSel.has(o.value)} onChange={() => setStaffSel((s) => toggle(s, o.value))} />{o.label}
              </label></li>
            ))}
            {staffShown.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">{staffOpts.length ? 'No match.' : 'Add staff first.'}</li>}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Add students <span className="font-normal text-muted-foreground">({stuSel.size} selected)</span></h3>
          <SearchBox value={stuQ} onChange={setStuQ} placeholder="Search by name, admission no or phone…" />
          {stuSel.size > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(stuSel).map((id) => (
                <button key={id} type="button" onClick={() => setStuSel((s) => toggle(s, id))} className="rounded-full bg-purple/10 px-2.5 py-1 text-xs font-semibold text-purple">{stuNames[id] || 'Student'} ×</button>
              ))}
            </div>
          )}
          <ul className="mt-2 max-h-56 divide-y overflow-y-auto rounded-xl border">
            {loading && <li className="py-4 text-center text-sm text-muted-foreground">Loading…</li>}
            {students.map((s) => (
              <li key={s._id}><label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 hover:bg-muted/50">
                <input type="checkbox" className="h-4 w-4 accent-purple" checked={stuSel.has(s._id)} onChange={() => { setStuNames((n) => ({ ...n, [s._id]: s.name })); setStuSel((x) => toggle(x, s._id)) }} />
                <span className="min-w-0">{s.name} <span className="text-xs text-muted-foreground">{s.admissionNo}{s.batch ? ` · now in ${s.batch.name}` : ''}</span></span>
              </label></li>
            ))}
            {!loading && students.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No students to show.</li>}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">A student belongs to one batch; adding moves them here.</p>
        </section>

        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0">
          <button type="button" className={btn('ghost')} onClick={onClose}>Cancel</button>
          <button className={btn('primary')} disabled={busy}>{busy ? 'Saving…' : 'Save batch'}</button>
        </div>
      </form>
    </Modal>
  )
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

// Whole months between two dates, rounded up (e.g. 1 Jun to 15 Aug = 3)
const monthsBetween = (a: string, b: string) => Math.max(1, Math.ceil((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000 / 30.4375))

// Course details with a calendar for the duration and the weekdays classes run on
function CourseModal({ course, onClose, onSaved }: { course: Course | null; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ name: course?.name || '', code: course?.code || '', startDate: course?.startDate || '', endDate: course?.endDate || '', totalFee: course?.totalFee ? String(course.totalFee) : '', installments: instToText(course?.installments) })
  const [days, setDays] = useState<Set<number>>(new Set(course?.classDays || [1, 2, 3, 4, 5]))
  const [months, setMonths] = useState(course?.durationMonths ? String(course.durationMonths) : '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: string, val: string) => setV((x) => ({ ...x, [k]: val }))
  const auto = v.startDate && v.endDate && v.endDate >= v.startDate ? monthsBetween(v.startDate, v.endDate) : null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const body: Record<string, unknown> = { name: v.name.trim(), code: v.code.trim(), classDays: Array.from(days).sort() }
      if (v.startDate) body.startDate = v.startDate
      if (v.endDate) body.endDate = v.endDate
      const dur = auto ?? (Number(months) || undefined)
      if (dur) body.durationMonths = dur
      if (v.totalFee !== '') body.totalFee = Number(v.totalFee)
      body.installments = textToInst(v.installments)
      if (course) await api.patch(`/admin/courses/${course._id}`, body)
      else await api.post('/admin/courses', body)
      notifyOk('Course saved')
      onSaved()
    } catch (e2) { setErr(errorMessage(e2)); setBusy(false) }
  }

  return (
    <Modal open title={course ? 'Edit course' : 'Add course'} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Course name <span className="text-red-600">*</span></span>
            <input className={inputCls} value={v.name} onChange={(e) => set('name', e.target.value)} required /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Code <span className="text-red-600">*</span></span>
            <input className={inputCls} value={v.code} onChange={(e) => set('code', e.target.value)} required />
            <span className="text-xs text-muted-foreground">Short unique code, e.g. ABV</span></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Starts on</span>
            <input type="date" className={inputCls} value={v.startDate} onChange={(e) => set('startDate', e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Ends on</span>
            <input type="date" className={inputCls} value={v.endDate} min={v.startDate || undefined} onChange={(e) => set('endDate', e.target.value)} /></label>
        </div>

        <div className="text-sm">
          {auto !== null ? (
            <p className="rounded-lg bg-purple/5 px-3 py-2 text-purple">Duration: <b>{auto} month{auto === 1 ? '' : 's'}</b>, worked out from the dates.</p>
          ) : (
            <label className="flex flex-col gap-1 sm:w-1/2"><span className="font-medium">Duration (months)</span>
              <input type="number" min={1} className={inputCls} value={months} onChange={(e) => setMonths(e.target.value)} />
              <span className="text-xs text-muted-foreground">Or pick the start and end dates above.</span></label>
          )}
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Class days</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAY_ORDER.map((d) => {
              const on = days.has(d)
              return <button key={d} type="button" aria-pressed={on} onClick={() => setDays((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n })}
                className={`min-h-10 min-w-[3.25rem] rounded-full border px-3 text-sm font-semibold transition ${on ? 'border-purple bg-purple text-white' : 'border-purple/20 bg-purple/5 text-purple'}`}>{DAYS[d]}</button>
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm sm:w-1/2"><span className="font-medium">Total fee (₹)</span>
          <input type="number" min={0} className={inputCls} value={v.totalFee} onChange={(e) => set('totalFee', e.target.value)} /></label>
        <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Instalments</span>
          <textarea className={`${inputCls} h-24 py-2`} value={v.installments} onChange={(e) => set('installments', e.target.value)} />
          <span className="text-xs text-muted-foreground">One per line: label, amount, due-offset-days (days after the fee start date). Example: Instalment 1, 6000, 0</span></label>

        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0">
          <button type="button" className={btn('ghost')} onClick={onClose}>Cancel</button>
          <button className={btn('primary')} disabled={busy}>{busy ? 'Saving…' : 'Save course'}</button>
        </div>
      </form>
    </Modal>
  )
}
