'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; content: string; links?: { label: string; href: string }[] }

const SUGGESTIONS = ['Courses for a 5 year old', 'Are classes online?', 'Home tuition for Class 8', 'Do you offer a free demo?']
const GREETING: Msg = { role: 'assistant', content: 'Hi! I can help with our courses, age groups, online or offline classes and demo classes. What would you like to know?' }

// Website assistant. Answers come from the server: Groq when available, built-in answers otherwise.
export default function ChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, open, busy])
  useEffect(() => { setOpen(false) }, [pathname])

  // The enquiry form has its own sticky submit bar on phones
  if (pathname?.startsWith('/enquiry')) return null

  const send = async (content: string) => {
    const q = content.trim()
    if (!q || busy) return
    const next: Msg[] = [...msgs, { role: 'user', content: q }]
    setMsgs(next)
    setText('')
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-8).map(({ role, content: c }) => ({ role, content: c })) }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.message || 'failed')
      setMsgs([...next, { role: 'assistant', content: json.data.reply, links: json.data.links }])
    } catch {
      setMsgs([...next, { role: 'assistant', content: 'Sorry, I could not answer just now. Please call +91 93630 42019 or send us an enquiry.', links: [{ label: 'Send an enquiry', href: '/enquiry' }] }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with us"
          className="hypershade fixed bottom-5 right-4 z-40 flex h-14 items-center gap-2 rounded-full px-5 font-bold text-white shadow-xl transition hover:scale-105 sm:bottom-6 sm:right-6"
        >
          <span className="relative z-10 flex items-center gap-2"><MessageCircle className="h-5 w-5" /> <span className="hidden sm:inline">Ask us</span></span>
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="Chat assistant" className="fixed inset-x-2 bottom-2 z-50 flex max-h-[80dvh] min-h-[22rem] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-purple/20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]">
          <header className="hypershade flex items-center justify-between px-4 py-3 text-white">
            <span className="relative z-10 flex items-center gap-2 font-display font-bold"><Sparkles className="h-5 w-5 text-yellow" /> Global Edutech assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="relative z-10 rounded-lg p-1 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-purpleLight/40 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'rounded-br-md bg-purple text-white' : 'rounded-bl-md bg-white text-foreground'}`}>
                  <p className="whitespace-pre-line">{m.content}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} className="rounded-full bg-purple/10 px-3 py-1 text-xs font-bold text-purple hover:bg-purple hover:text-white">{l.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex"><div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm"><Loader2 className="h-4 w-4 animate-spin text-purple" /></div></div>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-purple/30 bg-white px-3 py-1.5 text-xs font-semibold text-purple hover:bg-purple hover:text-white">{s}</button>)}
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex items-center gap-2 border-t bg-white p-2.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              placeholder="Type your question…"
              aria-label="Your question"
              className="h-11 min-w-0 flex-1 rounded-full border-2 border-purple/20 px-4 text-base focus:border-purple focus:outline-none"
            />
            <button disabled={busy || !text.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple text-white disabled:opacity-50"><Send className="h-5 w-5" /></button>
          </form>
          <p className="bg-white px-3 pb-2 text-center text-[11px] text-foreground/50">Please don&apos;t share personal details here. AI answers may be imperfect; for fees and timings, call us.</p>
        </div>
      )}
    </>
  )
}
