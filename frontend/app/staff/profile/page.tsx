'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { Card, ConfirmDialog, ErrorState, PageHeader, Spinner, btn, inputCls } from '@/components/portal/kit'
import FileUploader from '@/components/portal/FileUploader'
import { api, fmtDate, openFile } from '@/lib/portal/api'
import { notifyError, notifyOk, useData } from '@/lib/portal/hooks'

type Profile = {
  id: string; name: string; email: string; phone?: string; avatarKey?: string; employeeId?: string; designation?: string; joinDate?: string
  shiftStart?: string; shiftEnd?: string; leaveBalance?: { casual: number; sick: number }; documents?: { key: string; name?: string }[]
}

export default function StaffProfilePage() {
  const { data, loading, error, reload } = useData<Profile>('/staff/profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<string | null>(null)
  useEffect(() => { if (data) { setName(data.name); setPhone(data.phone || '') } }, [data])

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !data) return <ErrorState message={error || 'Could not load profile'} onRetry={reload} />

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await api.patch('/staff/profile', { name, phone }); notifyOk('Profile updated'); reload() } catch (x) { notifyError(x) } finally { setSaving(false) }
  }
  const rows: [string, string | undefined][] = [
    ['Employee ID', data.employeeId], ['Email', data.email], ['Designation', data.designation], ['Joined', data.joinDate ? fmtDate(data.joinDate) : undefined],
    ['Shift', data.shiftStart ? `${data.shiftStart} – ${data.shiftEnd}` : undefined], ['Leave balance', data.leaveBalance ? `${data.leaveBalance.casual} casual · ${data.leaveBalance.sick} sick` : undefined],
  ]
  return (
    <>
      <PageHeader title="My profile" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Details">
          <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v || '-'}</dd></div>)}</dl>
          <p className="mb-3 text-xs text-muted-foreground">Name and phone are yours to edit. Email, designation and shift are managed by the admin.</p>
          <form onSubmit={save} className="space-y-3">
            <label className="block text-sm font-medium">Name<input className={`${inputCls} mt-1`} value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label className="block text-sm font-medium">Phone<input className={`${inputCls} mt-1`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <button className={btn('primary')} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
          </form>
        </Card>
        <Card title="Photo & documents">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {data.avatarKey ? <button className={btn('outline', 'sm')} onClick={() => openFile(data.avatarKey!).catch(notifyError)}>View photo</button> : <span className="text-sm text-muted-foreground">No photo</span>}
            <FileUploader purpose="STAFF_AVATAR" ownerId={data.id} label="Upload photo" accept="image/jpeg,image/png" onDone={reload} />
          </div>
          <ul className="mb-3 space-y-1 text-sm">
            {(data.documents || []).map((d) => (
              <li key={d.key} className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5">
                <button className="truncate text-purple hover:underline" onClick={() => openFile(d.key).catch(notifyError)}>{d.name || 'Document'}</button>
                <button className="text-red-600" aria-label="Delete document" onClick={() => setDel(d.key)}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
            {!data.documents?.length && <li className="text-muted-foreground">No documents uploaded</li>}
          </ul>
          <FileUploader purpose="STAFF_DOC" ownerId={data.id} label="Upload document" onDone={reload} />
          <p className="mt-3 text-xs text-muted-foreground">JPG, PNG or PDF, up to 5 MB.</p>
        </Card>
      </div>
      <ConfirmDialog open={!!del} title="Delete document" message="This permanently removes the file." onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del('/files', { key: del }); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
    </>
  )
}
