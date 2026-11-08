'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { Card, Column, DataTable, FilterSelect, PageHeader, btn, inputCls } from '@/components/portal/kit'
import { api, fmtDate, money } from '@/lib/portal/api'
import { notifyError, useList } from '@/lib/portal/hooks'

type Payment = { _id: string; receiptNo?: string; amount: number; mode: string; reference?: string; paidOn: string; student?: { name: string; admissionNo: string }; receivedBy?: { name: string }; studentFee?: { installmentLabel: string } }

export default function PaymentsPage() {
  const [mode, setMode] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const { rows, meta, loading, error, reload } = useList<Payment>('/admin/payments', { page, limit: 20, mode, from, to })
  const [busy, setBusy] = useState<string | null>(null)

  const receipt = async (p: Payment) => {
    setBusy(p._id)
    try {
      const { data } = await api.get<{ url: string }>(`/admin/payments/${p._id}/receipt`)
      window.open(data.url, '_blank', 'noopener')
    } catch (e) { notifyError(e) } finally { setBusy(null) }
  }

  const columns: Column<Payment>[] = [
    { key: 'paidOn', header: 'Date', sortable: true, render: (p) => fmtDate(p.paidOn) },
    { key: 'receiptNo', header: 'Receipt', mobileHidden: true },
    { key: 'student', header: 'Student', sortable: true, value: (p) => p.student?.name, render: (p) => <span><span className="font-medium">{p.student?.name}</span><br /><span className="text-xs text-muted-foreground">{p.studentFee?.installmentLabel}</span></span> },
    { key: 'amount', header: 'Amount', sortable: true, render: (p) => <span className="font-semibold">{money(p.amount)}</span> },
    { key: 'mode', header: 'Mode', render: (p) => <span>{p.mode}{p.reference ? <><br /><span className="text-xs text-muted-foreground">{p.reference}</span></> : null}</span> },
    { key: 'receivedBy', header: 'Received by', mobileHidden: true, value: (p) => p.receivedBy?.name, render: (p) => p.receivedBy?.name },
    { key: 'a', header: '', className: 'text-right', render: (p) => <button className={btn('outline', 'sm')} disabled={busy === p._id} onClick={() => receipt(p)}><FileDown className="h-4 w-4" /> Receipt</button> },
  ]
  return (
    <>
      <PageHeader title="Payments" subtitle="Every payment recorded, with PDF receipts stored in private storage" />
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FilterSelect label="Any mode" value={mode} onChange={(v) => { setMode(v); setPage(1) }} options={['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE'].map((v) => ({ value: v, label: v }))} />
          <input type="date" className={`${inputCls} w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="From" />
          <input type="date" className={`${inputCls} w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="To" />
        </div>
        <DataTable columns={columns} rows={rows} meta={meta} loading={loading} error={error} onRetry={reload} onPage={setPage} exportName="payments" emptyTitle="No payments yet" />
      </Card>
    </>
  )
}
