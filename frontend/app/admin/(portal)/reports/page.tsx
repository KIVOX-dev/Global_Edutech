'use client'

import { useState } from 'react'
import { Download, Loader2, Play } from 'lucide-react'
import { Card, Column, DataTable, FilterSelect, PageHeader, btn, inputCls } from '@/components/portal/kit'
import { api, todayIST } from '@/lib/portal/api'
import { notifyError, notifyOk, useBatchOptionsSafe } from '@/lib/portal/hooks-reports'

type Row = Record<string, string | number | null>
type Low = { id: string; name: string; admissionNo: string; batch?: string; percentage: number; present: number; late: number; absent: number }

const addDays = (d: string, n: number) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10) }

export default function ReportsPage() {
  const batches = useBatchOptionsSafe()
  const [type, setType] = useState<'student' | 'batch' | 'staff'>('student')
  const [from, setFrom] = useState(addDays(todayIST(), -29))
  const [to, setTo] = useState(todayIST())
  const [batch, setBatch] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [csvBusy, setCsvBusy] = useState(false)
  const [low, setLow] = useState<{ threshold: number; students: Low[] } | null>(null)
  const [lowBusy, setLowBusy] = useState(false)

  const query = { type, from, to, batch: type === 'student' ? batch : undefined }

  const run = async () => {
    setBusy(true)
    try { setRows((await api.get<{ rows: Row[] }>('/admin/reports/attendance', { ...query, format: 'json' })).data.rows) } catch (e) { notifyError(e) } finally { setBusy(false) }
  }

  // CSV is saved to Backblaze B2 and returned as a short-lived link; without B2 the server streams the CSV directly
  const exportCsv = async () => {
    setCsvBusy(true)
    try {
      const { data } = await api.get<string | { url: string }>('/admin/reports/attendance', { ...query, format: 'csv' })
      if (typeof data === 'string') {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
        a.download = `attendance-${type}-${from}_to_${to}.csv`
        a.click()
      } else window.open(data.url, '_blank', 'noopener')
      notifyOk('CSV ready')
    } catch (e) { notifyError(e) } finally { setCsvBusy(false) }
  }

  const loadLow = async () => {
    setLowBusy(true)
    try { setLow((await api.get<{ threshold: number; students: Low[] }>('/admin/reports/low-attendance', { from, to })).data) } catch (e) { notifyError(e) } finally { setLowBusy(false) }
  }

  const cols: Column<Row>[] = rows && rows[0] ? Object.keys(rows[0]).map((k) => ({ key: k, header: k.replace(/([A-Z])/g, ' $1'), sortable: true, value: (r: Row) => r[k] as string | number })) : []
  const lowCols: Column<Low>[] = [
    { key: 'name', header: 'Student', sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'admissionNo', header: 'Adm. no', mobileHidden: true },
    { key: 'batch', header: 'Batch' },
    { key: 'present', header: 'P', mobileHidden: true },
    { key: 'late', header: 'L', mobileHidden: true },
    { key: 'absent', header: 'A', mobileHidden: true },
    { key: 'percentage', header: '%', sortable: true, render: (s) => <span className="font-semibold text-red-600">{s.percentage}%</span> },
  ]

  return (
    <>
      <PageHeader title="Reports" subtitle="Attendance reports exclude holidays and non-working days from percentages" />
      <Card title="Attendance report">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterSelect label="Report type" value={type} onChange={(v) => { setType(v as typeof type); setRows(null) }} options={[{ value: 'student', label: 'By student' }, { value: 'batch', label: 'By batch' }, { value: 'staff', label: 'Staff' }]} />
          {type === 'student' && <FilterSelect label="All batches" value={batch} onChange={setBatch} options={batches} />}
          <input type="date" className={`${inputCls} w-auto`} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <span className="text-sm">to</span>
          <input type="date" className={`${inputCls} w-auto`} value={to} max={todayIST()} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          <button className={btn('primary')} onClick={run} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run</button>
          <button className={btn('outline')} onClick={exportCsv} disabled={csvBusy}>{csvBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV</button>
        </div>
        {rows ? <DataTable columns={cols} rows={rows as unknown as { id?: string }[] as never} loading={busy} emptyTitle="No attendance in this range" /> : <p className="py-8 text-center text-sm text-muted-foreground">Pick a range and press Run.</p>}
      </Card>

      <Card title="Low attendance students" className="mt-4" actions={<button className={btn('outline', 'sm')} onClick={loadLow} disabled={lowBusy}>{lowBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Load</button>}>
        {low ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">Students below {low.threshold}% between {from} and {to} (threshold is set in Settings).</p>
            <DataTable columns={lowCols} rows={low.students} rowKey={(s) => s.id} exportName="low-attendance" emptyTitle="Nobody is below the threshold" />
          </>
        ) : <p className="py-6 text-center text-sm text-muted-foreground">Press Load to list students under the threshold.</p>}
      </Card>
    </>
  )
}
