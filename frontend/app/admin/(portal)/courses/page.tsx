'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, Field, FormModal, Modal, PageHeader, SearchBox, StatusBadge, btn, clean } from '@/components/portal/kit'
import { api, money } from '@/lib/portal/api'
import { notifyError, notifyOk, useDebounced, useList } from '@/lib/portal/hooks'
import { useCourseOptions, useStaffOptions } from '@/lib/portal/options'

type Installment = { label: string; amount: number; dueOffsetDays: number }
type Course = { _id: string; name: string; code: string; durationMonths: number; totalFee: number; installments: Installment[] }
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

  const fields: Field[] = [
    { name: 'name', label: 'Course name', required: true, half: true },
    { name: 'code', label: 'Code', required: true, half: true, help: 'Short unique code, e.g. ABV' },
    { name: 'durationMonths', label: 'Duration (months)', type: 'number', half: true },
    { name: 'totalFee', label: 'Total fee (₹)', type: 'number', half: true },
    { name: 'installments', label: 'Instalments', type: 'textarea', help: 'One per line: label, amount, due-offset-days (days after the fee start date). Example: Instalment 1, 6000, 0' },
  ]
  const save = async (v: Record<string, string | boolean>) => {
    const { installments, ...rest } = v
    const body: Record<string, unknown> = clean(rest, ['durationMonths', 'totalFee'])
    body.installments = textToInst(String(installments || ''))
    if (edit === 'new') await api.post('/admin/courses', body)
    else if (edit) await api.patch(`/admin/courses/${edit._id}`, body)
    notifyOk('Course saved')
    reload()
  }

  const columns: Column<Course>[] = [
    { key: 'code', header: 'Code', sortable: true },
    { key: 'name', header: 'Course', sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'durationMonths', header: 'Months', mobileHidden: true },
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
      <FormModal open={!!edit} title={edit === 'new' ? 'Add course' : 'Edit course'} wide fields={fields} initial={edit && edit !== 'new' ? { ...edit, installments: instToText(edit.installments) } : undefined} onSubmit={save} onClose={() => setEdit(null)} />
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

  const fields: Field[] = [
    { name: 'name', label: 'Batch name', required: true, half: true },
    { name: 'course', label: 'Course', type: 'select', options: courses, required: true, half: true },
    { name: 'startDate', label: 'Start date', type: 'date', half: true },
    { name: 'endDate', label: 'End date', type: 'date', half: true },
    { name: 'timings', label: 'Timings', placeholder: '9:00 - 10:30', half: true },
    { name: 'isActive', label: 'Active', type: 'checkbox', half: true },
  ]
  const save = async (v: Record<string, string | boolean>) => {
    const body = clean(v)
    body.isActive = Boolean(v.isActive)
    if (edit === 'new') await api.post('/admin/batches', body)
    else if (edit) await api.patch(`/admin/batches/${edit._id}`, body)
    notifyOk('Batch saved')
    reload()
  }

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
      <FormModal open={!!edit} title={edit === 'new' ? 'Add batch' : 'Edit batch'} fields={fields} initial={edit && edit !== 'new' ? { ...edit, course: edit.course?._id } : { isActive: true }} onSubmit={save} onClose={() => setEdit(null)} />
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
