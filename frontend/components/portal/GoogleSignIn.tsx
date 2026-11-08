'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/portal/api'

type GoogleId = {
  initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string; auto_select?: boolean }) => void
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
}
declare global { interface Window { google?: { accounts: { id: GoogleId } } } }

const SRC = 'https://accounts.google.com/gsi/client'

// Official "Sign in with Google" button. Hidden when the server has no Google client id configured.
export default function GoogleSignIn({ onCredential, disabled }: { onCredential: (credential: string) => void; disabled?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const cb = useRef(onCredential)
  cb.current = onCredential
  const [clientId, setClientId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    api.get<{ googleClientId: string | null }>('/auth/config').then((r) => { if (alive) setClientId(r.data.googleClientId) }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!clientId || !box.current) return
    const draw = () => {
      const g = window.google?.accounts.id
      if (!g || !box.current) return
      g.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential), ux_mode: 'popup', auto_select: false })
      box.current.innerHTML = ''
      const width = Math.min(Math.max(box.current.offsetWidth, 200), 400)
      g.renderButton(box.current, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', logo_alignment: 'left', width })
      setReady(true)
    }
    if (window.google?.accounts) { draw(); return }
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`)
    if (!s) {
      s = document.createElement('script')
      s.src = SRC
      s.async = true
      s.defer = true
      document.head.appendChild(s)
    }
    s.addEventListener('load', draw)
    s.addEventListener('error', () => setFailed(true))
    return () => s?.removeEventListener('load', draw)
  }, [clientId])

  if (!clientId || failed) return null
  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : undefined} aria-busy={!ready}>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <div ref={box} className="flex min-h-[44px] w-full justify-center" />
      <p className="mt-2 text-center text-xs text-muted-foreground">Use the Google account that your administrator added.</p>
    </div>
  )
}
