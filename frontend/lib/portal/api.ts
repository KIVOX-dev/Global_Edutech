// Browser API client for the institute management system.
// Same-origin (/api is proxied to Express in dev and served by the same AppSail service in production),
// so the httpOnly auth cookies are sent automatically.

export type Meta = { page: number; limit: number; total: number; totalPages: number }
export type ApiResult<T> = { data: T; meta?: Meta }

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

function qs(query?: Query) {
  if (!query) return ''
  const p = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

let refreshing: Promise<boolean> | null = null
function refreshSession() {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => { refreshing = null }, 0)
      })
  }
  return refreshing
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query, retried = false): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(`/api${path}${qs(query)}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection.')
  }

  if (res.status === 401 && !retried && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh')) {
    if (await refreshSession()) return request<T>(method, path, body, query, true)
    // The first "am I signed in?" check on a page is allowed to fail quietly: only a real call from a signed-in session means "expired"
    if (typeof window !== 'undefined' && !path.startsWith('/auth/me')) window.dispatchEvent(new Event('portal:session-expired'))
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/csv')) return { data: (await res.text()) as unknown as T }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json || json.success === false) {
    throw new ApiError(res.status, json?.code || 'ERROR', json?.message || `Request failed (${res.status})`, json?.details)
  }
  return { data: json.data as T, meta: json.meta }
}

export const api = {
  get: <T,>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T,>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, body ?? {}, query),
  patch: <T,>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T,>(path: string, body?: unknown) => request<T>('DELETE', path, body ?? {}),
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

// ---------- file upload to Backblaze B2 through presigned URLs ----------
export type UploadPurpose = 'STUDENT_PHOTO' | 'STUDENT_DOC' | 'STAFF_DOC' | 'STAFF_AVATAR'

export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  ownerId: string,
  onProgress?: (pct: number) => void,
) {
  const { data: signed } = await api.post<{ url: string; key: string; headers: Record<string, string> }>('/files/upload-url', {
    purpose, ownerId, fileName: file.name, contentType: file.type, size: file.size,
  })
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signed.url)
    Object.entries(signed.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(xhr.status, 'UPLOAD_FAILED', 'Upload to storage failed. Check the bucket CORS rule.')))
    xhr.onerror = () => reject(new ApiError(0, 'UPLOAD_FAILED', 'Upload blocked. Check the Backblaze bucket CORS rule.'))
    xhr.send(file)
  })
  const { data } = await api.post('/files/confirm', { key: signed.key, fileName: file.name })
  return data
}

export async function openFile(key: string) {
  const { data } = await api.get<{ url: string }>('/files/download-url', { key })
  window.open(data.url, '_blank', 'noopener')
}

// ---------- helpers ----------
export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
export const money = (n?: number | null) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const fmtDate = (d?: string | null) => {
  if (!d) return '-'
  const [y, m, day] = d.split('T')[0].split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[Number(m) - 1]} ${y}`
}
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '-')
export const fmtTime = (d?: string | null) => (d ? new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '-')

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: { header: string; key: string }[]) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]).map((k) => ({ header: k, key: k })) : [])
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : String(v)
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.map((c) => cell(c.header)).join(','), ...rows.map((r) => cols.map((c) => cell(r[c.key])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
