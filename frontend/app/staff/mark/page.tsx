'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, FilterSelect, PageHeader, Spinner, inputCls } from '@/components/portal/kit'
import MarkSheet from '@/components/portal/MarkSheet'
import { todayIST } from '@/lib/portal/api'
import { useData } from '@/lib/portal/hooks'

type Batch = { _id: string; name: string }

function Inner() {
  const params = useSearchParams()
  const { data: batches } = useData<Batch[]>('/staff/batches')
  const [batch, setBatch] = useState(params.get('batch') || '')
  const [date, setDate] = useState(todayIST())

  useEffect(() => { if (!batch && batches?.length === 1) setBatch(batches[0]._id) }, [batches, batch])

  return (
    <>
      <PageHeader title="Mark attendance" subtitle="Tap a name to flip Present / Absent, or use the buttons for Late and Excused" />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterSelect label="Select batch" value={batch} onChange={setBatch} options={(batches || []).map((b) => ({ value: b._id, label: b.name }))} />
          <input type="date" className={`${inputCls} w-auto`} value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        </div>
        {batch && date ? <MarkSheet key={`${batch}-${date}`} batchId={batch} date={date} /> : <p className="py-10 text-center text-sm text-muted-foreground">Choose a batch to load the roster.</p>}
      </Card>
    </>
  )
}

export default function MarkPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>}><Inner /></Suspense>
}
