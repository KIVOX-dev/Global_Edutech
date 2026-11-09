'use client'

import { useMemo, useState } from 'react'
import { FileUp, FolderOpen, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  ConfirmDialog, DataTable, Field, FilterSelect, FormModal, Modal, PageHeader, SearchBox, StatusBadge, btn, clean, Column, Card,
} from '@/components/portal/kit'
import FileUploader from '@/components/portal/FileUploader'
import { api, openFile } from '@/lib/portal/api'
import { notifyError, notifyOk, useData, useDebounced, useList } from '@/lib/portal/hooks'
import { useBatchOptions, useCourseOptions } from '@/lib/portal/options'

type Student = {
  _id: string; admissionNo: string; name: string; email?: string; phone?: string; parentName?: string; parentEmail?: string; parentPhone?: string
  course?: { _id: string; name: string; code: string }; batch?: { _id: string; name: string }; status: 'ACTIVE' | 'INACTIVE'
  photoKey?: string; documents?: { key: string; name?: string; size?: number }[]
}
type ImportResult = { totalRows: number; valid: number; imported: number; failed: number; errors: { row: number; errors: string[] }[]; dryRun: boolean }

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [batch, setBatch] = useState('')
  const [course, setCourse] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Student>('/admin/students', { page, limit: 15, search: q, batch, course, status })
  const batches = useBatchOptions()
  const courses = useCourseOptions()

  const [edit, setEdit] = useState<Student | 'new' | null>(null)
  const [del, setDel] = useState<Student | null>(null)
  const [docs, setDocs] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [login, setLogin] = useState<{ email: string; password?: string; created: boolean; children: number } | null>(null)

  // Creates the parent's portal login from the parent email on the admission record
  const parentLogin = async (s: Student) => {
    try {
      const { data } = await api.post<{ email: string; temporaryPassword?: string; created: boolean; children: number }>(`/admin/students/${s._id}/parent-login`)
      setLogin({ email: data.email, password: data.temporaryPassword, created: data.created, children: data.children })
    } catch (e) { notifyError(e) }
  }

  const feeFields: Field[] = edit === 'new' ? [
    { name: 'totalFee', label: 'Total fee (Rs.)', type: 'number', half: true, help: 'Optional. Creates the fee for this student now' },
    { name: 'frequency', label: 'Paid', type: 'select', half: true, options: [{ value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Quarterly' }, { value: 'YEARLY', label: 'Yearly' }] },
    { name: 'installmentCount', label: 'Number of installments', type: 'number', half: true, help: 'Default 1 (full fee)' },
  ] : []

  const fields: Field[] = useMemo(() => [
    { name: 'name', label: 'Student name', required: true, half: true },
    { name: 'admissionNo', label: 'Admission no.', half: true, help: 'Leave blank to auto-generate' },
    { name: 'parentName', label: 'Parent name', half: true },
    { name: 'parentPhone', label: 'Parent phone', type: 'tel', half: true },
    { name: 'parentEmail', label: 'Parent email', type: 'email', help: 'Fee reminders are also sent here' },
    { name: 'course', label: 'Course', type: 'select', options: courses, half: true, help: courses.length ? undefined : 'No courses yet. Add one in Courses & Batches first.' },
    { name: 'batch', label: 'Batch', type: 'select', options: batches, half: true, help: batches.length ? undefined : 'No batches yet. Add one in Courses & Batches.' },
    { name: 'status', label: 'Status', type: 'select', half: true, options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
    ...feeFields,
  ], [courses, batches, edit === 'new']) // eslint-disable-line react-hooks/exhaustive-deps

  const columns: Column<Student>[] = [
    { key: 'admissionNo', header: 'Adm. no', sortable: true },
    { key: 'name', header: 'Name', sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'course', header: 'Course', mobileHidden: true, value: (s) => s.course?.name, render: (s) => s.course?.name || '-' },
    { key: 'batch', header: 'Batch', value: (s) => s.batch?.name, render: (s) => s.batch?.name || '-' },
    { key: 'parent', header: 'Parent', mobileHidden: true, value: (s) => s.parentName, render: (s) => <span>{s.parentName || '-'}<br /><span className="text-xs text-muted-foreground">{s.parentPhone}</span></span> },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge value={s.status} /> },
    {
      key: 'actions', header: '', className: 'text-right whitespace-nowrap',
      render: (s) => (
        <div className="flex justify-end gap-1">
          <button className={btn('ghost', 'sm')} title="Parent login" onClick={() => parentLogin(s)}><KeyRound className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} title="Photo & documents" onClick={() => setDocs(s._id)}><FolderOpen className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} title="Edit" onClick={() => setEdit(s)}><Pencil className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} title="Delete" onClick={() => setDel(s)}><Trash2 className="h-4 w-4 text-red-600" /></button>
        </div>
      ),
    },
  ]

  const save = async (v: Record<string, string | boolean>) => {
    const { totalFee, installmentCount, frequency, ...rest } = v
    const body = clean(rest)
    // blank selects must clear the link on edit
    if (edit !== 'new') { if (!v.course) body.course = null; if (!v.batch) body.batch = null }
    let feeNote = ''
    if (edit === 'new') {
      const fee = Number(totalFee)
      if (fee > 0 && !v.course) throw new Error('Choose a course to attach the fee to')
      const { data: s } = await api.post<{ _id: string }>('/admin/students', body)
      if (fee > 0) {
        try {
          const r = await api.post<{ created: number }>('/admin/fees/generate', { studentId: s._id, totalFee: fee, installmentCount: Number(installmentCount) || 1, frequency: frequency || 'MONTHLY' })
          feeNote = `, ${r.data.created} fee installment(s) created`
        } catch (e) { notifyError(e); feeNote = ', but the fee could not be created (add it from Fees)' }
      }
    } else if (edit) await api.patch(`/admin/students/${edit._id}`, body)
    notifyOk(edit === 'new' ? `Student added${feeNote}` : 'Student updated')
    reload()
  }

  return (
    <>
      <PageHeader
        title="Students" subtitle="Admissions, parents and batch placement"
        actions={<>
          <button className={btn('outline')} onClick={() => setImporting(true)}><FileUp className="h-4 w-4" /> Import CSV</button>
          <button className={btn('primary')} onClick={() => setEdit('new')}><Plus className="h-4 w-4" /> Add student</button>
        </>}
      />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Name, admission no, phone…" />
          <FilterSelect label="All batches" value={batch} onChange={(v) => { setBatch(v); setPage(1) }} options={batches} />
          <FilterSelect label="All courses" value={course} onChange={(v) => { setCourse(v); setPage(1) }} options={courses} />
          <FilterSelect label="Any status" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="students" emptyTitle="No students found" emptyHint="Add a student or import a CSV." />
      </Card>

      <FormModal open={!!edit} title={edit === 'new' ? 'Add student' : 'Edit student'} wide fields={fields} initial={edit && edit !== 'new' ? { ...edit, course: edit.course?._id, batch: edit.batch?._id } : { status: 'ACTIVE', frequency: 'MONTHLY' }} onSubmit={save} onClose={() => setEdit(null)} />
      <Modal open={!!login} title="Parent login" onClose={() => setLogin(null)}>
        {login?.created ? (
          <div className="space-y-3 text-sm">
            <p>Parent login created. We also emailed these details to the parent.</p>
            <p className="rounded-xl bg-muted/60 p-3">Email: <b>{login.email}</b><br />Temporary password: <b className="select-all">{login.password}</b></p>
            <p className="text-muted-foreground">They sign in at the normal login page and must choose a new password. Students with this parent email ({login.children} now) all appear under this one login.</p>
          </div>
        ) : (
          <p className="text-sm">A parent login already exists for <b>{login?.email}</b> and shows {login?.children} student(s). The parent can use "Forgot password" on the login page to get a new password.</p>
        )}
        <div className="mt-4 flex justify-end"><button className={btn('primary')} onClick={() => setLogin(null)}>Done</button></div>
      </Modal>
      <ConfirmDialog
        open={!!del} title="Delete student" message={`Delete ${del?.name}? Students with attendance or fee records cannot be deleted; set them to Inactive instead.`}
        onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/students/${del!._id}`); notifyOk('Student deleted'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }}
      />
      {docs && <DocsModal id={docs} onClose={() => { setDocs(null); reload() }} />}
      <ImportModal open={importing} onClose={() => { setImporting(false); reload() }} />
    </>
  )
}

function DocsModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: s, reload } = useData<Student>(`/admin/students/${id}`)
  const [del, setDel] = useState<string | null>(null)
  return (
    <Modal open title={s ? `Files: ${s.name}` : 'Files'} onClose={onClose} wide>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Photo</h3>
          {s?.photoKey ? <button className={btn('outline', 'sm')} onClick={() => openFile(s.photoKey!).catch(notifyError)}>View photo</button> : <p className="mb-2 text-sm text-muted-foreground">No photo yet</p>}
          <div className="mt-2"><FileUploader purpose="STUDENT_PHOTO" ownerId={id} label="Upload photo" accept="image/jpeg,image/png" onDone={reload} /></div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Documents</h3>
          <ul className="mb-2 space-y-1 text-sm">
            {(s?.documents || []).map((d) => (
              <li key={d.key} className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5">
                <button className="truncate text-purple hover:underline" onClick={() => openFile(d.key).catch(notifyError)}>{d.name || 'Document'}</button>
                <button className="text-red-600" aria-label="Delete document" onClick={() => setDel(d.key)}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
            {!s?.documents?.length && <li className="text-muted-foreground">No documents</li>}
          </ul>
          <FileUploader purpose="STUDENT_DOC" ownerId={id} label="Upload document" onDone={reload} />
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">JPG, PNG or PDF, up to 5 MB. Files go straight to private storage and open through short-lived links.</p>
      <ConfirmDialog open={!!del} title="Delete document" message="This permanently removes the file." onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del('/files', { key: del }); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
    </Modal>
  )
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const run = async (dryRun: boolean) => {
    setBusy(true)
    try { setResult((await api.post<ImportResult>('/admin/students/import', { csv, dryRun })).data) } catch (e) { notifyError(e) } finally { setBusy(false) }
  }
  return (
    <Modal open={open} title="Import students from CSV" onClose={onClose} wide>
      <p className="text-sm text-muted-foreground">Columns: <code>name, email, phone, parentName, parentEmail, parentPhone, admissionNo, courseCode, batchName</code>. Only <code>name</code> is required. Up to 500 rows.</p>
      <input type="file" accept=".csv,text/csv" className="mt-3 block text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setCsv(await f.text()); setResult(null) } }} />
      <textarea className="mt-3 h-32 w-full rounded-lg border p-2 font-mono text-xs" value={csv} onChange={(e) => { setCsv(e.target.value); setResult(null) }} placeholder="Or paste CSV here" />
      <div className="mt-3 flex justify-end gap-2">
        <button className={btn('outline')} disabled={!csv || busy} onClick={() => run(true)}>Validate only</button>
        <button className={btn('primary')} disabled={!csv || busy} onClick={() => run(false)}>Import</button>
      </div>
      {result && (
        <div className="mt-4 rounded-xl border p-3 text-sm">
          <p className="font-medium">{result.dryRun ? 'Validation' : 'Import'} result: {result.valid} valid row(s){!result.dryRun && `, ${result.imported} imported`}, {result.failed} with errors.</p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-red-700">
              {result.errors.map((e) => <li key={e.row}>Row {e.row}: {e.errors.join('; ')}</li>)}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}
