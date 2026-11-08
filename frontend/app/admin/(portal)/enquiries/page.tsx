'use client'

import { useState } from 'react'
import { Check, Copy, Loader2, Mail, MessageCircle, Pencil, Phone, Plus, Send, Sparkles, StickyNote, Trash2 } from 'lucide-react'
import { Card, Column, ConfirmDialog, DataTable, FilterSelect, FormModal, Modal, PageHeader, SearchBox, StatusBadge, btn, clean, inputCls } from '@/components/portal/kit'
import { api, fmtDateTime } from '@/lib/portal/api'
import { notifyError, notifyOk, useDebounced, useList } from '@/lib/portal/hooks'

type Enquiry = {
  _id: string; name: string; email: string; phone: string; program?: string; studentAge?: string; preferredTime?: string; mode?: string
  message?: string; status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'ENROLLED' | 'CLOSED'; note?: string; createdAt: string
  ai?: { category?: string; urgency?: string; summary?: string; source?: string }
  repliedAt?: string
}
const URGENCY: Record<string, string> = { high: 'bg-red-100 text-red-700', normal: 'bg-sky-100 text-sky-700', low: 'bg-gray-100 text-gray-600' }
const STATUSES = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'ENROLLED', 'CLOSED'] as const
const digits = (p: string) => p.replace(/[^\d]/g, '')

export default function EnquiriesPage() {
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { rows, meta, loading, error, reload } = useList<Enquiry>('/admin/enquiries', { page, limit: 15, search: q, status })
  const [note, setNote] = useState<Enquiry | null>(null)
  const [del, setDel] = useState<Enquiry | null>(null)
  const [reply, setReply] = useState<Enquiry | null>(null)

  const setState = async (e: Enquiry, s: string) => {
    try { await api.patch(`/admin/enquiries/${e._id}`, { status: s }); notifyOk('Status updated'); reload() } catch (x) { notifyError(x) }
  }

  const columns: Column<Enquiry>[] = [
    { key: 'name', header: 'Enquiry', sortable: true, render: (e) => <span><span className="font-medium">{e.name}</span><br /><span className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</span></span> },
    { key: 'phone', header: 'Contact', render: (e) => <span>{e.phone}<br /><span className="text-xs text-muted-foreground break-all">{e.email}</span></span> },
    { key: 'program', header: 'Program', value: (e) => e.program, render: (e) => <span>{e.program || '-'}<br /><span className="text-xs text-muted-foreground">{[e.mode, e.studentAge, e.preferredTime].filter(Boolean).join(' · ')}</span></span> },
    {
      key: 'message', header: 'Message', mobileHidden: true,
      render: (e) => (
        <div className="max-w-xs text-sm">
          {e.ai?.category && (
            <div className="mb-1 flex flex-wrap gap-1">
              <span className="rounded-full bg-purple/10 px-2 py-0.5 text-[11px] font-bold text-purple">{e.ai.category}</span>
              {e.ai.urgency && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${URGENCY[e.ai.urgency] || URGENCY.normal}`}>{e.ai.urgency} priority</span>}
            </div>
          )}
          <span className="line-clamp-2">{e.ai?.summary || e.message}</span>
        </div>
      ),
    },
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
          <button className={btn('outline', 'sm')} onClick={() => setReply(e)}><Sparkles className="h-4 w-4" /> Reply</button>
          <button className={btn('ghost', 'sm')} onClick={() => setNote(e)}>{e.note ? 'Edit note' : 'Add note'}</button>
          <button className={btn('ghost', 'sm')} title="Delete" onClick={() => setDel(e)}><Trash2 className="h-4 w-4 text-red-600" /></button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Website enquiries land here. Add phone calls and walk-ins yourself"
        actions={<button className={btn('primary')} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add enquiry</button>} />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Name, phone, program…" />
          <FilterSelect label="All statuses" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="enquiries" renderCard={(e) => <EnquiryCard e={e} onStatus={(s) => setState(e, s)} onReply={() => setReply(e)} onNote={() => setNote(e)} onDelete={() => setDel(e)} />} emptyTitle="No enquiries yet" emptyHint="They appear here as soon as someone submits the form." />
      </Card>
      {reply && <ReplyModal enquiry={reply} onClose={() => setReply(null)} onSent={reload} />}
      <FormModal open={adding} title="Add enquiry" wide submitLabel="Save enquiry" onClose={() => setAdding(false)}
        fields={[
          { name: 'name', label: 'Parent / contact name', required: true, half: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true, half: true },
          { name: 'email', label: 'Email', type: 'email', half: true, help: 'Optional. Needed only to email a reply' },
          { name: 'source', label: 'How did they reach you?', type: 'select', half: true, options: ['Phone call', 'Walk-in', 'WhatsApp', 'Other'].map((v) => ({ value: v, label: v })) },
          { name: 'program', label: 'Program', half: true, placeholder: 'e.g. Handwriting' },
          { name: 'studentAge', label: 'Child age', half: true, placeholder: 'e.g. 3-5 years' },
          { name: 'mode', label: 'Class mode', type: 'select', half: true, options: [{ value: 'Online', label: 'Online' }, { value: 'Offline', label: 'Offline' }] },
          { name: 'preferredTime', label: 'Preferred time', half: true, placeholder: 'Morning (9am - 12pm)' },
          { name: 'message', label: 'Notes', type: 'textarea', placeholder: 'What did they ask about?' },
        ]}
        initial={{ source: 'Walk-in' }}
        onSubmit={async (v) => { await api.post('/admin/enquiries', clean(v)); notifyOk('Enquiry added'); reload() }} />
      <FormModal open={!!note} title={`Follow-up note: ${note?.name}`} fields={[{ name: 'note', label: 'Note', type: 'textarea', placeholder: 'Called, will visit on Saturday…' }]} initial={note || undefined}
        onSubmit={async (v) => { await api.patch(`/admin/enquiries/${note!._id}`, { note: String(v.note || '') }); notifyOk('Note saved'); reload() }} onClose={() => setNote(null)} />
      <ConfirmDialog open={!!del} title="Delete enquiry" message={`Delete the enquiry from ${del?.name}?`} onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.del(`/admin/enquiries/${del!._id}`); notifyOk('Enquiry deleted'); setDel(null); reload() } catch (e) { notifyError(e); setDel(null) } }} />
    </>
  )
}

const LANGS = [{ value: 'en', label: 'English' }, { value: 'ta', label: 'தமிழ் (Tamil)' }, { value: 'hi', label: 'हिन्दी (Hindi)' }]

// Drafts a reply with AI (Groq) or, when it is unavailable, with a built-in template. Always editable before sending.
function ReplyModal({ enquiry, onClose, onSent }: { enquiry: Enquiry; onClose: () => void; onSent: () => void }) {
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [language, setLanguage] = useState('en')
  const [text, setText] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [subjectEdit, setSubjectEdit] = useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    try {
      const { data } = await api.post<{ text: string; source: 'ai' | 'fallback' }>(`/admin/enquiries/${enquiry._id}/draft-reply`, { channel, language })
      // keep the subject in its own field so the message box holds only the message
      const parts = data.text.split(String.fromCharCode(10))
      if (channel === 'email' && parts[0].startsWith('Subject:')) {
        setSubjectEdit(parts[0].replace('Subject:', '').trim())
        setText(parts.slice(1).join(String.fromCharCode(10)).trim())
      } else {
        setSubjectEdit(null)
        setText(data.text)
      }
      setSource(data.source)
    } catch (e) { notifyError(e) } finally { setBusy(false) }
  }
  const wa = `https://wa.me/${digits(enquiry.phone).length === 10 ? `91${digits(enquiry.phone)}` : digits(enquiry.phone)}?text=${encodeURIComponent(text)}`
  const sendNow = async () => {
    setSending(true)
    try {
      await api.post(`/admin/enquiries/${enquiry._id}/send-reply`, { subject: subjectText, body })
      notifyOk('Email sent', `Sent to ${enquiry.email} through Brevo`)
      onSent()
      onClose()
    } catch (e) { notifyError(e) } finally { setSending(false) }
  }
  const lines = text.split(/\r?\n/)
  const subject = text.startsWith('Subject:') ? lines[0].replace('Subject:', '').trim() : 'Your enquiry at Global Edutech'
  const body = text.startsWith('Subject:') ? lines.slice(1).join('\n').trim() : text
  const subjectText = subjectEdit ?? subject

  return (
    <Modal open title={`Reply to ${enquiry.name}`} onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-3">
        <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'email')} aria-label="Channel">
          <option value="whatsapp">WhatsApp message</option>{enquiry.email && <option value="email">Email</option>}
        </select>
        <select className={inputCls} value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
          {LANGS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <button className={btn('primary')} onClick={generate} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {text ? 'Regenerate' : 'Draft reply'}</button>
      </div>
      {source && (
        <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${source === 'ai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {source === 'ai' ? 'Written by AI: please read before sending' : 'Template draft (AI unavailable or limit reached)'}
        </p>
      )}
      {channel === 'email' && (
        <label className="mt-3 block text-sm font-medium">Subject
          <input className={`${inputCls} mt-1`} value={subjectText} onChange={(e) => setSubjectEdit(e.target.value)} />
        </label>
      )}
      <textarea className="mt-3 h-48 w-full rounded-xl border-2 border-purple/20 p-3 text-base focus:border-purple focus:outline-none" value={text} onChange={(e) => setText(e.target.value)} placeholder="Press “Draft reply” to write a message you can edit and send." />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <button className={btn('outline')} disabled={!text} onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
        </button>
        {channel === 'whatsapp'
          ? <a className={btn('success')} aria-disabled={!text} style={!text ? { pointerEvents: 'none', opacity: 0.5 } : undefined} href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Open in WhatsApp</a>
          : (
            <>
              <a className={btn('outline')} aria-disabled={!text} style={!text ? { pointerEvents: 'none', opacity: 0.5 } : undefined} href={`mailto:${enquiry.email}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(body)}`}>Open in email app</a>
              <button className={`${btn('success')} col-span-2 sm:col-auto`} disabled={body.length < 5 || sending} onClick={sendNow}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send email now
              </button>
            </>
          )}
      </div>
      {channel === 'email' && <p className="mt-2 text-right text-xs text-muted-foreground">“Send email now” sends this message to <strong>{enquiry.email}</strong> through Brevo and marks the enquiry as Contacted.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Only the first name, program, age range and message are used to write the draft. The phone number and email are never sent to the AI.</p>
    </Modal>
  )
}

const STATUS_TONE: Record<string, string> = {
  NEW: 'border-sky-300 bg-sky-50 text-sky-800', CONTACTED: 'border-amber-300 bg-amber-50 text-amber-800', IN_PROGRESS: 'border-purple/40 bg-purple/10 text-purple',
  ENROLLED: 'border-emerald-300 bg-emerald-50 text-emerald-800', CLOSED: 'border-gray-300 bg-gray-100 text-gray-700',
}

// Phone layout: everything stacked and thumb-sized, the full message visible, actions in a clear order
function EnquiryCard({ e, onStatus, onReply, onNote, onDelete }: { e: Enquiry; onStatus: (s: string) => void; onReply: () => void; onNote: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const long = (e.message || '').length > 140
  const wa = `https://wa.me/${digits(e.phone).length === 10 ? `91${digits(e.phone)}` : digits(e.phone)}`
  const details = [e.program, e.mode, e.studentAge, e.preferredTime].filter(Boolean)
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight">{e.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</p>
        </div>
        <select
          className={`h-10 shrink-0 rounded-xl border-2 px-2 text-sm font-semibold ${STATUS_TONE[e.status] || ''}`}
          value={e.status}
          onChange={(ev) => onStatus(ev.target.value)}
          aria-label={`Status for ${e.name}`}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {(e.ai?.category || e.repliedAt) && (
        <div className="flex flex-wrap gap-1.5">
          {e.ai?.category && <span className="rounded-full bg-purple/10 px-2.5 py-0.5 text-xs font-bold text-purple">{e.ai.category}</span>}
          {e.ai?.urgency && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${URGENCY[e.ai.urgency] || URGENCY.normal}`}>{e.ai.urgency} priority</span>}
          {e.repliedAt && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Replied {fmtDateTime(e.repliedAt).split(',')[0]}</span>}
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        <a href={`tel:${e.phone}`} className="flex min-h-9 items-center gap-2 font-medium text-foreground"><Phone className="h-4 w-4 shrink-0 text-purple" />{e.phone}</a>
        {e.email && <a href={`mailto:${e.email}`} className="flex min-h-9 items-center gap-2 break-all text-foreground/80"><Mail className="h-4 w-4 shrink-0 text-purple" />{e.email}</a>}
      </div>

      {details.length > 0 && <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs leading-relaxed text-foreground/80">{details.join('  ·  ')}</p>}

      {e.message && (
        <div className="text-sm leading-relaxed">
          <p className={`whitespace-pre-line ${open || !long ? '' : 'line-clamp-3'}`}>{e.message}</p>
          {long && <button className="mt-1 text-xs font-bold text-purple" onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Read more'}</button>}
        </div>
      )}

      {e.note && <p className="flex items-start gap-2 rounded-xl bg-yellow/30 px-3 py-2 text-sm"><StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span>{e.note}</span></p>}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a className={`${btn('success', 'md')} w-full`} href={`tel:${e.phone}`}><Phone className="h-4 w-4" /> Call</a>
        <a className={`${btn('outline', 'md')} w-full`} href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        <button className={`${btn('primary', 'md')} col-span-2 w-full`} onClick={onReply}><Sparkles className="h-4 w-4" /> Reply</button>
      </div>
      <div className="flex items-center justify-between border-t pt-2">
        <button className={btn('ghost', 'sm')} onClick={onNote}><Pencil className="h-4 w-4" /> {e.note ? 'Edit note' : 'Add note'}</button>
        <button className={btn('ghost', 'sm')} onClick={onDelete} aria-label={`Delete enquiry from ${e.name}`}><Trash2 className="h-4 w-4 text-red-600" /></button>
      </div>
    </div>
  )
}
