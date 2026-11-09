'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Card, EmptyState, ErrorState, Spinner, cx } from './kit'
import { useData } from '@/lib/portal/hooks'

export type Child = {
  id: string; name: string; admissionNo: string
  course: { name: string; code: string; classDays: number[] } | null
  batch: { name: string; timings?: string } | null
  window: { start: string; end: string | null; totalDays: number | null; daysDone: number | null; daysRemaining: number | null; progress: number | null; status: string }
  attendance30: { present: number; late: number; absent: number; excused: number; counted: number; percentage: number | null }
  today: string | null
  fees: { totalFee: number; totalPaid: number; totalDue: number; overdueAmount: number; next: { label: string; amount: number; dueDate: string; daysToDue: number } | null }
}
type Ctx = { children: Child[]; child: Child; select: (id: string) => void }
const ChildCtx = createContext<Ctx | null>(null)
const KEY = 'ge-parent-child'

export const useChild = () => {
  const c = useContext(ChildCtx)
  if (!c) throw new Error('useChild must be used inside ChildProvider')
  return c
}

// Loads the parent's children once and remembers which one is selected
export function ChildProvider({ children: page }: { children: React.ReactNode }) {
  const { data, loading, error, reload } = useData<{ today: string; children: Child[] }>('/parent/children')
  const [id, setId] = useState('')
  useEffect(() => { try { setId(localStorage.getItem(KEY) || '') } catch { /* optional */ } }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (error || !data) return <ErrorState message={error || 'Could not load your details'} onRetry={reload} />
  if (!data.children.length) return <Card><EmptyState title="No student linked to this login yet" hint="Please contact the institute. They link your child using the parent email on the admission record." /></Card>

  const child = data.children.find((c) => c.id === id) || data.children[0]
  const select = (v: string) => { setId(v); try { localStorage.setItem(KEY, v) } catch { /* optional */ } }
  return (
    <ChildCtx.Provider value={{ children: data.children, child, select }}>
      {data.children.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose child">
          {data.children.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === child.id} onClick={() => select(c.id)}
              className={cx('min-h-10 rounded-full border px-4 text-sm font-semibold transition', c.id === child.id ? 'border-purple bg-purple text-white' : 'border-purple/20 bg-card text-purple')}>{c.name.split(' ')[0]}</button>
          ))}
        </div>
      )}
      {page}
    </ChildCtx.Provider>
  )
}
