'use client'

import { useState } from 'react'
import { KeyRound, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, Field, FilterSelect, FormModal, Modal, PageHeader, SearchBox, StatusBadge, btn, clean } from '@/components/portal/kit'
import { api, fmtDateTime } from '@/lib/portal/api'
import { notifyError, notifyOk, useDebounced, useList } from '@/lib/portal/hooks'

type Staff = {
  id: string; name: string; email: string; phone?: string; isActive: boolean; lastLoginAt?: string
  employeeId?: string; designation?: string; joinDate?: string; shiftStart?: string; shiftEnd?: string; leaveBalance?: { casual: number; sick: number }
}

const FIELDS: Field[] = [
  { name: 'name', label: 'Full name', required: true, half: true },
  { name: 'email', label: 'Email (login)', type: 'email', required: true, half: true },
  { name: 'phone', label: 'Phone', type: 'tel', half: true },
  { name: 'employeeId', label: 'Employee ID', half: true, help: 'Auto-generated if blank' },
  { name: 'designation', label: 'Designation', half: true },
  { name: 'joinDate', label: 'Join date', type: 'date', half: true },
  { name: 'shiftStart', label: 'Shift start', type: 'time', half: true },
  { name: 'shiftEnd', label: 'Shift end', type: 'time', half: true },
  { name: 'casual', label: 'Casual leave balance', type: 'number', half: true },
  { name: 'sick', label: 'Sick leave balance', type: 'number', half: true },
]

export default function StaffPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Staff>('/admin/staff', { page, limit: 15, search: q, status })
  const [edit, setEdit] = useState<Staff | 'new' | null>(null)
  const [del, setDel] = useState<Staff | null>(null)
  const [reset, setReset] = useState<Staff | null>(null)
  const [secret, setSecret] = useState<{ name: string; password: string } | null>(null)

  const toggle = async (s: Staff) => {
    try { await api.patch(`/admin/staff/${s.id}/status`, { isActive: !s.isActive }); notifyOk(s.isActive ? 'Staff deactivated' : 'Staff activated'); reload() } catch (e) { notifyError(e) }
  }

  const columns: Column<Staff>[] = [
    { key: 'employeeId', header: 'Emp ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true, render: (s) => <span><span className="font-medium">{s.name}</span><br /><span className="text-xs text-muted-foreground">{s.email}</span></span> },
    { key: 'designation', header: 'Designation', mobileHidden: true },
    { key: 'shift', header: 'Shift', mobileHidden: true, value: (s) => s.shiftStart, render: (s) => `${s.shiftStart || '-'} – ${s.shiftEnd || '-'}` },
    { key: 'leave', header: 'Leave (C/S)', mobileHidden: true, value: (s) => s.leaveBalance?.casual, render: (s) => `${s.leaveBalance?.casual ?? '-'} / ${s.leaveBalance?.sick ?? '-'}` },
    { key: 'lastLoginAt', header: 'Last login', mobileHidden: true, render: (s) => fmtDateTime(s.lastLoginAt) },
    { key: 'isActive', header: 'Status', value: (s) => (s.isActive ? 'ACTIVE' : 'INACTIVE'), render: (s) => <StatusBadge value={s.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'actions', header: '', className: 'text-right whitespace-nowrap',
      render: (s) => (
        <div className="flex justify-end gap-1">
          <button className={btn('ghost', 'sm')} title="Edit" onClick={() => setEdit(s)}><Pencil className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} title={s.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggle(s)}><Power className={`h-4 w-4 ${s.isActive ? 'text-emerald-600' : 'text-gray-400'}`} /></button>
          <button className={btn('ghost', 'sm')} title="Reset password" onClick={() => setReset(s)}><KeyRound className="h-4 w-4" /></button>
          <button className={btn('ghost', 'sm')} title="Delete" onClick={() => setDel(s)}><Trash2 className="h-4 w-4 text-red-600" /></button>
        </div>
      ),
    },
  ]

  const save = async (v: Record<string, string | boolean>) => {
    const { casual, sick, ...rest } = v
    const body: Record<string, unknown> = clean(rest)
    if (casual !== '' || sick !== '') body.leaveBalance = clean({ casual, sick }, ['casual', 'sick'])
    if (edit === 'new') {
      const { data } = await api.post<{ temporaryPassword?: string }>('/admin/staff', body)
      notifyOk('Staff added')
      if (data.temporaryPassword) setSecret({ name: String(v.name), password: data.temporaryPassword })
    } else if (edit) {
      await api.patch(`/admin/staff/${edit.id}`, body)
      notifyOk('Staff updated')
    }
    reload()
  }

  return (
    <>
      <PageHeader title="Staff" subtitle="Teachers and coordinators who can sign in to the staff portal" actions={<button className={btn('primary')} onClick={() => setEdit('new')}><Plus className="h-4 w-4" /> Add staff</button>} />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Name, email, employee ID…" />
          <FilterSelect label="Any status" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="staff" rowKey={(s) => s.id} emptyTitle="No staff yet" />
      </Card>

      <FormModal open={!!edit} title={edit === 'new' ? 'Add staff' : 'Edit staff'} wide fields={FIELDS}
        initial={edit && edit !== 'new' ? { ...edit, casual: edit.leaveBalance?.casual, sick: edit.leaveBalance?.sick } : { shiftStart: '09:00', shiftEnd: '17:00' }}
        onSubmit={save} onClose={() => setEdit(null)} />
      <ConfirmDialog open={!!del} title="Delete staff" message={`Delete ${del?.name}? Staff with attendance or batch assignments cannot be deleted; deactivate them instead.`} onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/staff/${del!.id}`); notifyOk('Staff deleted'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
      <ConfirmDialog open={!!reset} danger={false} confirmLabel="Reset password" title="Reset password" message={`Generate a new temporary password for ${reset?.name}? They will be signed out and asked to change it.`} onClose={() => setReset(null)}
        onConfirm={async () => { try { const { data } = await api.post<{ temporaryPassword: string }>(`/admin/staff/${reset!.id}/reset-password`); setSecret({ name: reset!.name, password: data.temporaryPassword }); setReset(null) } catch (e) { notifyError(e); setReset(null) } }} />
      <Modal open={!!secret} title="Temporary password" onClose={() => setSecret(null)}>
        <p className="text-sm">Share this with <strong>{secret?.name}</strong>. It is shown only once and must be changed at first login.</p>
        <p className="my-4 select-all rounded-xl bg-muted px-4 py-3 text-center font-mono text-lg tracking-wide">{secret?.password}</p>
        <div className="flex justify-end"><button className={btn('primary')} onClick={() => setSecret(null)}>Done</button></div>
      </Modal>
    </>
  )
}
