'use client'

import { useEffect, useState } from 'react'
import { api } from './api'

export type Option = { value: string; label: string }

// Loads <select> options from a list endpoint (courses, batches, staff…)
export function useOptions(path: string, label: (row: Record<string, any>) => string, enabled = true) {
  const [options, setOptions] = useState<Option[]>([])
  useEffect(() => {
    if (!enabled) return
    let alive = true
    api.get<Record<string, any>[]>(path, { limit: 100 })
      .then((r) => alive && setOptions(r.data.map((x) => ({ value: String(x._id || x.id), label: label(x) }))))
      .catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled])
  return options
}

export const useCourseOptions = () => useOptions('/admin/courses', (c) => `${c.name} (${c.code})`)
export const useBatchOptions = () => useOptions('/admin/batches', (b) => b.name)
export const useStaffOptions = () => useOptions('/admin/staff', (s) => s.name)
