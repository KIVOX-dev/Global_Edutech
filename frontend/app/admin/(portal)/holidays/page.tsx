'use client'

import { useState } from 'react'
import { CalendarPlus, Plus, Trash2 } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, FilterSelect, FormModal, Modal, PageHeader, StatusBadge, btn } from '@/components/portal/kit'
import { api, fmtDate } from '@/lib/portal/api'
import { notifyError, notifyOk, useList } from '@/lib/portal/hooks'
import { GovHoliday, hasFestivalDates, holidaysForYear } from '@/data/holidays-in'

type Holiday = { _id: string; date: string; title: string; type: string }

export default function HolidaysPage() {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(String(thisYear))
  const { rows, loading, error, reload } = useList<Holiday>('/admin/holidays', { year, limit: 100 })
  const [open, setOpen] = useState(false)
  const [del, setDel] = useState<Holiday | null>(null)
  const [gov, setGov] = useState(false)
  const columns: Column<Holiday>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (h) => fmtDate(h.date) },
    { key: 'title', header: 'Holiday', sortable: true, render: (h) => <span className="font-medium">{h.title}</span> },
    { key: 'type', header: 'Type', render: (h) => <StatusBadge value={h.type} /> },
    { key: 'a', header: '', className: 'text-right', render: (h) => <button className={btn('ghost', 'sm')} onClick={() => setDel(h)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button> },
  ]
  return (
    <>
      <PageHeader title="Holidays" subtitle="No attendance can be marked on holidays, and they are excluded from attendance percentages" actions={<><button className={btn('outline')} onClick={() => setGov(true)}><CalendarPlus className="h-4 w-4" /> Add government holidays</button><button className={btn('primary')} onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add holiday</button></>} />
      <Card>
        <div className="mb-3"><FilterSelect label="Year" value={year} onChange={setYear} options={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))} /></div>
        <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={reload} exportName="holidays" emptyTitle="No holidays for this year" />
      </Card>
      {gov && <GovHolidaysModal defaultYear={Number(year)} onClose={() => setGov(false)} onDone={reload} />}
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

const weekday = (d: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${d}T00:00:00Z`).getUTCDay()]

// Review the built-in Indian government list for a year, untick anything you do not observe, then add in one go
function GovHolidaysModal({ defaultYear, onClose, onDone }: { defaultYear: number; onClose: () => void; onDone: () => void }) {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(hasFestivalDates(defaultYear) ? defaultYear : thisYear)
  const list = holidaysForYear(year)
  const [off, setOff] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const picked = list.filter((h) => !off.has(h.date))
  const toggle = (d: string) => setOff((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n })

  const add = async () => {
    setBusy(true)
    try {
      const { data } = await api.post<{ created: number; skipped: number }>('/admin/holidays/bulk', { holidays: picked.map((h: GovHoliday) => ({ date: h.date, title: h.title, type: 'PUBLIC' })) })
      notifyOk(`${data.created} holiday(s) added`, data.skipped ? `${data.skipped} already existed and were skipped` : undefined)
      onDone()
      onClose()
    } catch (e) { notifyError(e) } finally { setBusy(false) }
  }

  return (
    <Modal open title="Add government holidays" onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Year" value={String(year)} onChange={(v) => { setYear(Number(v)); setOff(new Set()) }} options={[thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map((y) => ({ value: String(y), label: String(y) }))} />
        <button className={btn('ghost', 'sm')} onClick={() => setOff(new Set())}>Select all</button>
        <button className={btn('ghost', 'sm')} onClick={() => setOff(new Set(list.map((h) => h.date)))}>Clear</button>
        <span className="text-xs text-muted-foreground">{picked.length} of {list.length} selected</span>
      </div>
      {!hasFestivalDates(year) && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Festival dates for {year} are not in the built-in list yet (they change every year). Only the fixed-date holidays are shown. Add the festival days with “Add holiday” once the government publishes the {year} calendar.</p>
      )}
      <ul className="mt-3 max-h-[50vh] divide-y overflow-y-auto rounded-xl border">
        {list.map((h) => (
          <li key={h.date}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50">
              <input type="checkbox" className="h-5 w-5 shrink-0 accent-purple" checked={!off.has(h.date)} onChange={() => toggle(h.date)} />
              <span className="w-24 shrink-0 text-sm font-semibold">{fmtDate(h.date)}<span className="block text-xs font-normal text-muted-foreground">{weekday(h.date)}</span></span>
              <span className="min-w-0 flex-1 text-sm">{h.title}</span>
              <span className="hidden shrink-0 rounded-full bg-purple/10 px-2 py-0.5 text-[11px] font-bold text-purple sm:inline">{h.source}</span>
              {h.approx && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800" title="Moon-sighting festival: the date can shift by a day">±1 day</span>}
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">Central and Tamil Nadu government holidays. Please check the dates against the official gazette; “±1 day” festivals depend on the moon. Dates that already exist are skipped, and you can delete any holiday afterwards.</p>
      <div className="sticky bottom-0 -mx-5 mt-3 flex flex-col-reverse gap-2 border-t bg-background px-5 py-3 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0">
        <button className={btn('ghost')} onClick={onClose}>Cancel</button>
        <button className={btn('primary')} disabled={busy || picked.length === 0} onClick={add}>{busy ? 'Adding…' : `Add ${picked.length} holiday${picked.length === 1 ? '' : 's'}`}</button>
      </div>
    </Modal>
  )
}
