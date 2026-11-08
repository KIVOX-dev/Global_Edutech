'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, FilterSelect, FormModal, PageHeader, StatusBadge, btn } from '@/components/portal/kit'
import { api, fmtDate } from '@/lib/portal/api'
import { notifyError, notifyOk, useList } from '@/lib/portal/hooks'

type Holiday = { _id: string; date: string; title: string; type: string }

export default function HolidaysPage() {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(String(thisYear))
  const { rows, loading, error, reload } = useList<Holiday>('/admin/holidays', { year, limit: 200 })
  const [open, setOpen] = useState(false)
  const [del, setDel] = useState<Holiday | null>(null)
  const columns: Column<Holiday>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (h) => fmtDate(h.date) },
    { key: 'title', header: 'Holiday', sortable: true, render: (h) => <span className="font-medium">{h.title}</span> },
    { key: 'type', header: 'Type', render: (h) => <StatusBadge value={h.type} /> },
    { key: 'a', header: '', className: 'text-right', render: (h) => <button className={btn('ghost', 'sm')} onClick={() => setDel(h)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button> },
  ]
  return (
    <>
      <PageHeader title="Holidays" subtitle="No attendance can be marked on holidays, and they are excluded from attendance percentages" actions={<button className={btn('primary')} onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add holiday</button>} />
      <Card>
        <div className="mb-3"><FilterSelect label="Year" value={year} onChange={setYear} options={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))} /></div>
        <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={reload} exportName="holidays" emptyTitle="No holidays for this year" />
      </Card>
      <FormModal open={open} title="Add holiday" onClose={() => setOpen(false)}
        fields={[
          { name: 'date', label: 'Date', type: 'date', required: true, half: true },
          { name: 'type', label: 'Type', type: 'select', half: true, options: [{ value: 'PUBLIC', label: 'Public' }, { value: 'INSTITUTE', label: 'Institute' }, { value: 'OTHER', label: 'Other' }] },
          { name: 'title', label: 'Title', required: true },
        ]}
        initial={{ type: 'INSTITUTE' }}
        onSubmit={async (v) => { await api.post('/admin/holidays', { date: v.date, title: v.title, type: v.type || 'INSTITUTE' }); notifyOk('Holiday added'); reload() }} />
      <ConfirmDialog open={!!del} title="Delete holiday" message={`Remove ${del?.title} (${fmtDate(del?.date)})?`} onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/holidays/${del!._id}`); notifyOk('Holiday removed'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
    </>
  )
}
