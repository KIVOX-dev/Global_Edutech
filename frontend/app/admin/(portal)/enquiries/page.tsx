'use client'

import { useState } from 'react'
import { MessageCircle, Phone, Trash2 } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, FilterSelect, FormModal, PageHeader, SearchBox, StatusBadge, btn, inputCls } from '@/components/portal/kit'
import { api, fmtDateTime } from '@/lib/portal/api'
import { notifyError, notifyOk, useDebounced, useList } from '@/lib/portal/hooks'

type Enquiry = {
  _id: string; name: string; email: string; phone: string; program?: string; studentAge?: string; preferredTime?: string; mode?: string
  message?: string; status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'ENROLLED' | 'CLOSED'; note?: string; createdAt: string
}
const STATUSES = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'ENROLLED', 'CLOSED'] as const
const digits = (p: string) => p.replace(/[^\d]/g, '')

export default function EnquiriesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Enquiry>('/admin/enquiries', { page, limit: 15, search: q, status })
  const [note, setNote] = useState<Enquiry | null>(null)
  const [del, setDel] = useState<Enquiry | null>(null)

  const setState = async (e: Enquiry, s: string) => {
    try { await api.patch(`/admin/enquiries/${e._id}`, { status: s }); notifyOk('Status updated'); reload() } catch (x) { notifyError(x) }
  }

  const columns: Column<Enquiry>[] = [
    { key: 'name', header: 'Enquiry', sortable: true, render: (e) => <span><span className="font-medium">{e.name}</span><br /><span className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</span></span> },
    { key: 'phone', header: 'Contact', render: (e) => <span>{e.phone}<br /><span className="text-xs text-muted-foreground break-all">{e.email}</span></span> },
    { key: 'program', header: 'Program', value: (e) => e.program, render: (e) => <span>{e.program || '-'}<br /><span className="text-xs text-muted-foreground">{[e.mode, e.studentAge, e.preferredTime].filter(Boolean).join(' · ')}</span></span> },
    { key: 'message', header: 'Message', mobileHidden: true, render: (e) => <span className="line-clamp-2 max-w-xs text-sm">{e.message}</span> },
    {
      key: 'status', header: 'Status', value: (e) => e.status,
      render: (e) => (
        <select className={`${inputCls} sm:h-8 sm:w-36 sm:text-xs`} value={e.status} onChange={(ev) => setState(e, ev.target.value)} aria-label={`Status for ${e.name}`}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      ),
    },
    {
      key: 'a', header: '', className: 'text-right whitespace-nowrap',
      render: (e) => (
        <div className="flex flex-wrap justify-end gap-1">
          <a className={btn('success', 'sm')} href={`tel:${e.phone}`}><Phone className="h-4 w-4" /> Call</a>
          <a className={btn('outline', 'sm')} href={`https://wa.me/${digits(e.phone).length === 10 ? `91${digits(e.phone)}` : digits(e.phone)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          <button className={btn('ghost', 'sm')} onClick={() => setNote(e)}>{e.note ? 'Edit note' : 'Add note'}</button>
          <button className={btn('ghost', 'sm')} title="Delete" onClick={() => setDel(e)}><Trash2 className="h-4 w-4 text-red-600" /></button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Website enquiries" subtitle="Every enquiry from the Enquire Now form lands here" />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Name, phone, program…" />
          <FilterSelect label="All statuses" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="enquiries" emptyTitle="No enquiries yet" emptyHint="They appear here as soon as someone submits the form." />
      </Card>
      <FormModal open={!!note} title={`Follow-up note: ${note?.name}`} fields={[{ name: 'note', label: 'Note', type: 'textarea', placeholder: 'Called, will visit on Saturday…' }]} initial={note || undefined}
        onSubmit={async (v) => { await api.patch(`/admin/enquiries/${note!._id}`, { note: String(v.note || '') }); notifyOk('Note saved'); reload() }} onClose={() => setNote(null)} />
      <ConfirmDialog open={!!del} title="Delete enquiry" message={`Delete the enquiry from ${del?.name}?`} onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/enquiries/${del!._id}`); notifyOk('Enquiry deleted'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
    </>
  )
}
