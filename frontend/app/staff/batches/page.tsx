'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClipboardCheck, Users } from 'lucide-react'
import { Card, EmptyState, ErrorState, Modal, PageHeader, Spinner, StatusBadge, btn } from '@/components/portal/kit'
import { useData } from '@/lib/portal/hooks'

type Batch = { _id: string; name: string; timings?: string; isActive: boolean; studentCount: number; course?: { name: string } }
type Students = { batch: { name: string }; students: { _id: string; name: string; admissionNo: string; phone?: string; parentName?: string; parentPhone?: string }[] }

export default function MyBatchesPage() {
  const { data, loading, error, reload } = useData<Batch[]>('/staff/batches')
  const [open, setOpen] = useState<Batch | null>(null)
  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <>
      <PageHeader title="My batches" subtitle="Batches assigned to you by the admin" />
      {!data?.length ? <EmptyState title="No batches assigned yet" hint="Ask the admin to assign you to a batch." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => (
            <Card key={b._id}>
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-display font-semibold">{b.name}</h3><p className="text-sm text-muted-foreground">{b.course?.name}</p></div>
                <StatusBadge value={b.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <p className="mt-2 text-sm">{b.timings || 'No timings set'} · {b.studentCount} students</p>
              <div className="mt-3 flex gap-2">
                <button className={btn('outline', 'sm')} onClick={() => setOpen(b)}><Users className="h-4 w-4" /> Students</button>
                <Link href={`/staff/mark?batch=${b._id}`} className={btn('primary', 'sm')}><ClipboardCheck className="h-4 w-4" /> Mark attendance</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
      {open && <StudentsModal batch={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function StudentsModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const { data, loading, error, reload } = useData<Students>(`/staff/batches/${batch._id}/students`)
  return (
    <Modal open title={`Students: ${batch.name}`} onClose={onClose} wide>
      {loading ? <div className="flex justify-center py-8"><Spinner /></div> : error || !data ? <ErrorState message={error || 'Failed'} onRetry={reload} /> : (
        <ul className="divide-y text-sm">
          {data.students.map((s) => (
            <li key={s._id} className="flex flex-wrap items-center justify-between gap-1 py-2">
              <span><span className="font-medium">{s.name}</span> <span className="text-xs text-muted-foreground">{s.admissionNo}</span></span>
              <span className="text-xs text-muted-foreground">{s.parentName ? `${s.parentName} · ` : ''}{s.parentPhone || s.phone || ''}</span>
            </li>
          ))}
          {data.students.length === 0 && <li className="py-6 text-center text-muted-foreground">No students in this batch.</li>}
        </ul>
      )}
    </Modal>
  )
}
