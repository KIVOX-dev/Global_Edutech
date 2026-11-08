'use client'

import { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'

export type CookieChoice = 'all' | 'essential'
const KEY = 'ge-cookie-consent'
const EVENT = 'ge-cookie-change'
const OPEN_EVENT = 'ge-cookie-open'

export function readConsent(): CookieChoice | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'all' || v === 'essential' ? v : null
  } catch { return null }
}

function save(v: CookieChoice) {
  try { localStorage.setItem(KEY, v) } catch { /* private mode: the choice just lasts for this visit */ }
  window.dispatchEvent(new Event(EVENT))
}

// Lets other components (for example the Google sign-in button) react to the visitor's choice
export function useCookieConsent() {
  const [choice, setChoice] = useState<CookieChoice | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const read = () => setChoice(readConsent())
    read()
    setReady(true)
    window.addEventListener(EVENT, read)
    return () => window.removeEventListener(EVENT, read)
  }, [])
  return { choice, ready }
}

export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_EVENT))

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!readConsent()) setShow(true)
    const open = () => setShow(true)
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  if (!show) return null
  const choose = (v: CookieChoice) => { save(v); setShow(false) }

  return (
    <div role="dialog" aria-label="Cookie notice" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-2xl border border-purple/15 bg-white p-4 shadow-2xl sm:bottom-5 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple/10 text-purple"><Cookie className="h-5 w-5" /></span>
        <div className="min-w-0 text-sm leading-relaxed text-foreground/85">
          <p className="font-display text-base font-bold text-foreground">We use cookies</p>
          <p className="mt-1">
            Only the ones needed to keep you signed in to the portal, and to remember your preferences. No advertising or tracking cookies.
            Optional cookies come from Google sign-in on the login page. <a href="/cookie-policy" className="font-semibold text-purple underline">Cookie Policy</a>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button onClick={() => choose('essential')} className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-purple px-5 text-sm font-bold text-purple transition hover:bg-purple/5">Essential only</button>
        <button onClick={() => choose('all')} className="inline-flex h-11 items-center justify-center rounded-xl bg-purple px-5 text-sm font-bold text-white transition hover:bg-purple/90">Accept all</button>
      </div>
    </div>
  )
}
