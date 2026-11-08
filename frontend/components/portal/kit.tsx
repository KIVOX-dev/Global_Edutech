'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Inbox, Loader2, Search, X } from 'lucide-react'
import { Meta, downloadCsv, errorMessage } from '@/lib/portal/api'
import FancySelect from '@/components/forms/FancySelect'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success'
export const btn = (v: BtnVariant = 'primary', size: 'sm' | 'md' | 'lg' = 'md') =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple/60',
    size === 'sm' && 'h-10 min-w-10 px-3 text-xs sm:h-8 sm:min-w-0',
    size === 'md' && 'h-11 px-4 text-sm sm:h-10',
    size === 'lg' && 'h-12 px-6 text-base',
    v === 'primary' && 'bg-purple text-white hover:bg-purple/90 shadow-sm',
    v === 'outline' && 'border border-purple/40 text-purple hover:bg-purple/10',
    v === 'ghost' && 'text-foreground hover:bg-muted',
    v === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
    v === 'success' && 'bg-emerald-600 text-white hover:bg-emerald-700',
  )

export const inputCls = 'w-full h-11 rounded-lg border border-input bg-background px-3 text-base sm:h-10 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:opacity-60'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('h-5 w-5 animate-spin text-purple', className)} aria-label="Loading" />
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  )
}

export function Card({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-2xl border bg-card p-4 shadow-gentle sm:p-5', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint, tone = 'purple' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'purple' | 'green' | 'red' | 'amber' | 'blue' }) {
  const tones = { purple: 'bg-purple/10 text-purple', green: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700', blue: 'bg-sky-100 text-sky-700' }
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-gentle">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cx('mt-2 inline-block rounded-lg px-2 py-0.5 font-display text-2xl font-bold', tones[tone])}>{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const BADGES: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700', PAID: 'bg-emerald-100 text-emerald-700', APPROVED: 'bg-emerald-100 text-emerald-700', ACTIVE: 'bg-emerald-100 text-emerald-700', SENT: 'bg-emerald-100 text-emerald-700',
  ABSENT: 'bg-red-100 text-red-700', OVERDUE: 'bg-red-100 text-red-700', REJECTED: 'bg-red-100 text-red-700', FAILED: 'bg-red-100 text-red-700', INACTIVE: 'bg-gray-200 text-gray-700',
  LATE: 'bg-amber-100 text-amber-700', PARTIAL: 'bg-amber-100 text-amber-700', PENDING: 'bg-sky-100 text-sky-700', HALF_DAY: 'bg-amber-100 text-amber-700',
  EXCUSED: 'bg-sky-100 text-sky-700', ON_LEAVE: 'bg-purple/15 text-purple', SKIPPED: 'bg-gray-200 text-gray-700',
}
export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">-</span>
  return <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', BADGES[value] || 'bg-gray-100 text-gray-700')}>{value.replace('_', ' ')}</span>
}

export function EmptyState({ title = 'Nothing here yet', hint }: { title?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
      <Inbox className="h-10 w-10 opacity-50" />
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangle className="h-9 w-9 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && <button className={btn('outline', 'sm')} onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input className={cx(inputCls, 'pl-9')} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Search" />
    </div>
  )
}

export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
  return (
    <div className="w-full sm:w-auto sm:min-w-[9rem]">
      <FancySelect id={`fs-${label.replace(/\W+/g, '-')}`} label={label} className={cx(inputCls, 'w-full')} value={value} onChange={onChange} placeholder={label}
        options={[{ value: '', label }, ...options]} />
    </div>
  )
}

export function Pagination({ meta, onPage }: { meta?: Meta; onPage: (p: number) => void }) {
  if (!meta || meta.totalPages <= 1) return meta ? <p className="pt-3 text-xs text-muted-foreground">{meta.total} record{meta.total === 1 ? '' : 's'}</p> : null
  return (
    <div className="flex items-center justify-between gap-2 pt-3 text-sm">
      <span className="text-xs text-muted-foreground">{meta.total} records · page {meta.page} of {meta.totalPages}</span>
      <div className="flex gap-1">
        <button className={btn('outline', 'sm')} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <button className={btn('outline', 'sm')} disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

export type Column<T> = {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  value?: (row: T) => string | number | null | undefined // used for sorting and CSV export
  sortable?: boolean
  className?: string
  mobileHidden?: boolean
}

export function DataTable<T extends { _id?: string; id?: string }>({
  columns, rows, loading, error, onRetry, meta, onPage, emptyTitle, emptyHint, exportName, rowKey, renderCard,
}: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  meta?: Meta
  onPage?: (p: number) => void
  emptyTitle?: string
  emptyHint?: string
  exportName?: string
  rowKey?: (r: T) => string
  renderCard?: (row: T) => React.ReactNode // custom phone layout; the table is still used on desktop
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    const get = (r: T) => (col?.value ? col.value(r) : (r as Record<string, unknown>)[sort.key]) as string | number | null | undefined
    return [...rows].sort((a, b) => {
      const x = get(a) ?? ''
      const y = get(b) ?? ''
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
  }, [rows, sort, columns])

  const exportCsv = () => {
    const cols = columns.map((c) => ({ header: c.header, key: c.key }))
    const data = sorted.map((r) => Object.fromEntries(columns.map((c) => [c.key, c.value ? c.value(r) : (r as Record<string, unknown>)[c.key]])))
    downloadCsv(`${exportName || 'export'}.csv`, data, cols)
  }

  return (
    <div>
      {exportName && rows.length > 0 && (
        <div className="mb-3 flex sm:justify-end">
          <button className={cx(btn('outline', 'sm'), 'w-full sm:w-auto')} onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</button>
        </div>
      )}
      {error ? <ErrorState message={error} onRetry={onRetry} /> : (
        <>
          {/* Mobile: one card per row (no sideways scrolling) */}
          <div className="md:hidden">
            {loading && rows.length === 0 && <div className="flex justify-center py-10"><Spinner /></div>}
            <ul className={cx('space-y-3', loading && rows.length > 0 && 'opacity-60')}>
              {sorted.map((r, i) => {
                if (renderCard) return <li key={rowKey ? rowKey(r) : r._id || r.id || i} className="rounded-2xl border bg-card p-4 shadow-sm">{renderCard(r)}</li>
                const data = columns.filter((c) => c.header !== '')
                const actions = columns.filter((c) => c.header === '')
                const [first, ...rest] = data
                return (
                  <li key={rowKey ? rowKey(r) : r._id || r.id || i} className="rounded-2xl border bg-card p-3.5 shadow-sm">
                    {first && <div className="text-base font-medium">{first.render ? first.render(r) : String((r as Record<string, unknown>)[first.key] ?? '-')}</div>}
                    <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      {rest.map((c) => (
                        <div key={c.key} className="min-w-0">
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c.header}</dt>
                          <dd className="break-words">{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '-')}</dd>
                        </div>
                      ))}
                    </dl>
                    {actions.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">{actions.map((c) => <div key={c.key} className="w-full [&>div]:justify-start">{c.render?.(r)}</div>)}</div>}
                  </li>
                )
              })}
            </ul>
            {!loading && rows.length === 0 && <EmptyState title={emptyTitle} hint={emptyHint} />}
          </div>

          {/* Desktop: table */}
          <div className="relative hidden overflow-x-auto rounded-xl border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-purpleLight/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={cx('whitespace-nowrap px-3 py-2.5 font-semibold', c.className)}>
                      {c.sortable ? (
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))}>
                          {c.header}{sort?.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                        </button>
                      ) : c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((r, i) => (
                  <tr key={rowKey ? rowKey(r) : r._id || r.id || i} className="hover:bg-muted/40">
                    {columns.map((c) => (
                      <td key={c.key} className={cx('px-3 py-2.5 align-middle', c.className)}>
                        {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/60"><Spinner /></div>}
            {!loading && rows.length === 0 && <EmptyState title={emptyTitle} hint={emptyHint} />}
          </div>
        </>
      )}
      {onPage && <Pagination meta={meta} onPage={onPage} />}
    </div>
  )
}

export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={cx('max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-5', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button className="rounded-lg p-1 hover:bg-muted" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }: {
  open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void; onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className={btn('ghost')} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={btn(danger ? 'danger' : 'primary')} disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm() } finally { setBusy(false) } }}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export type Field = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'checkbox' | 'password'
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
  help?: string
  half?: boolean
}

// Config-driven form in a modal. Values are strings (checkbox: boolean); the caller converts on submit.
export function FormModal({ open, title, fields, initial, submitLabel = 'Save', onSubmit, onClose, wide }: {
  open: boolean; title: string; fields: Field[]; initial?: Record<string, unknown>; submitLabel?: string
  onSubmit: (values: Record<string, string | boolean>) => Promise<void>; onClose: () => void; wide?: boolean
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const v: Record<string, string | boolean> = {}
    fields.forEach((f) => {
      const x = initial?.[f.name]
      v[f.name] = f.type === 'checkbox' ? Boolean(x) : x === undefined || x === null ? '' : String(x)
    })
    setValues(v)
    setErr(null)
    setTimeout(() => firstRef.current?.focus(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  return (
    <Modal open={open} title={title} onClose={onClose} wide={wide}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setErr(null)
          try { await onSubmit(values); onClose() } catch (x) { setErr(errorMessage(x)) } finally { setBusy(false) }
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {fields.map((f, i) => (
          <label key={f.name} className={cx('flex flex-col gap-1 text-sm', !f.half && 'sm:col-span-2', f.type === 'checkbox' && 'flex-row items-center gap-2')}>
            {f.type === 'checkbox' ? (
              <>
                <input type="checkbox" className="h-4 w-4 accent-purple" checked={Boolean(values[f.name])} onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.checked }))} />
                <span>{f.label}</span>
              </>
            ) : (
              <>
                <span className="font-medium">{f.label}{f.required && <span className="text-red-600"> *</span>}</span>
                {f.type === 'select' ? (
                  <FancySelect
                    id={`f-${f.name}`} label={f.label} className={inputCls} required={f.required}
                    value={String(values[f.name] ?? '')} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
                    options={[{ value: '', label: f.placeholder || 'Select…' }, ...(f.options || [])]} placeholder={f.placeholder || 'Select…'}
                  />
                ) : f.type === 'textarea' ? (
                  <textarea className={cx(inputCls, 'h-24 py-2')} required={f.required} placeholder={f.placeholder} value={String(values[f.name] ?? '')} onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))} />
                ) : (
                  <input
                    ref={i === 0 ? firstRef : undefined}
                    className={inputCls}
                    type={f.type || 'text'}
                    inputMode={f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'number' ? 'decimal' : undefined}
                    autoCapitalize={f.type === 'email' ? 'none' : undefined}
                    required={f.required}
                    placeholder={f.placeholder}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={String(values[f.name] ?? '')}
                    onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                )}
                {f.help && <span className="text-xs text-muted-foreground">{f.help}</span>}
              </>
            )}
          </label>
        ))}
        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{err}</p>}
        <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:col-span-2 sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0">
          <button type="button" className={btn('ghost')} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className={btn('primary')} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{submitLabel}</button>
        </div>
      </form>
    </Modal>
  )
}

// Strips empty strings so optional fields are omitted from the request body
export function clean(values: Record<string, unknown>, numeric: string[] = []) {
  const out: Record<string, unknown> = {}
  Object.entries(values).forEach(([k, v]) => {
    if (v === '' || v === undefined) return
    out[k] = numeric.includes(k) ? Number(v) : v
  })
  return out
}
