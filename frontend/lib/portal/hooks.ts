'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, errorMessage, Meta } from './api'
import { toast } from '@/hooks/use-toast'

export function notifyError(e: unknown) {
  toast({ title: 'Something went wrong', description: errorMessage(e), variant: 'destructive' })
}
export const notifyOk = (title: string, description?: string) => toast({ title, description })

// Debounces a fast-changing value (search boxes)
export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

type Query = Record<string, string | number | boolean | undefined | null>

// Fetches a paginated list and exposes loading / error / reload
export function useList<T>(path: string, params: Query = {}, enabled = true) {
  const [rows, setRows] = useState<T[]>([])
  const [meta, setMeta] = useState<Meta | undefined>()
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(params)
  const seq = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const id = ++seq.current
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<T[]>(path, JSON.parse(key))
      if (id !== seq.current) return
      setRows(res.data)
      setMeta(res.meta)
    } catch (e) {
      if (id === seq.current) setError(errorMessage(e))
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [path, key, enabled])

  useEffect(() => { load() }, [load])
  return { rows, meta, loading, error, reload: load }
}

// Fetches a single resource
export function useData<T>(path: string | null, params: Query = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(params)

  const load = useCallback(async () => {
    if (!path) return
    setLoading(true)
    setError(null)
    try {
      setData((await api.get<T>(path, JSON.parse(key))).data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [path, key])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load, setData }
}
