'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string; label: string }

// Custom dropdown with a smooth open/close transition (native <select> menus cannot be animated)
export default function FancySelect({ id, label, value, onChange, options, placeholder = 'Select…', required, className = '' }: {
  id: string
  label?: string
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const root = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null)
  const listId = useId()
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // One highlight bar glides to whichever option the mouse (or arrow keys) is on
  useLayoutEffect(() => {
    const el = active >= 0 ? itemRefs.current[active] : null
    setBar(el ? { top: el.offsetTop, height: el.offsetHeight } : null)
  }, [active, open])

  const choose = (v: string) => { onChange(v); setOpen(false) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return setOpen(false)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) { setOpen(true); setActive(Math.max(0, options.findIndex((o) => o.value === value))); return }
      setActive((i) => (e.key === 'ArrowDown' ? Math.min(options.length - 1, i + 1) : Math.max(0, i - 1)))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open && active >= 0) choose(options[active].value)
      else setOpen(!open)
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => { setOpen(!open); setActive(options.findIndex((o) => o.value === value)) }}
        onKeyDown={onKey}
        className={`${className} flex items-center justify-between gap-2 text-left ${current ? 'text-foreground' : 'text-foreground/45'} ${open ? 'border-purple ring-4 ring-purple/15' : ''}`}
      >
        <span className="truncate">{current ? current.label : placeholder}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-purple transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Native input keeps browser "required" validation working */}
      {required && <input tabIndex={-1} aria-hidden required value={value} onChange={() => {}} className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0" />}

      <ul
        id={listId}
        role="listbox"
        aria-labelledby={id}
        onMouseLeave={() => setActive(options.findIndex((o) => o.value === value))}
        className={`absolute left-0 right-0 z-30 mt-2 max-h-64 origin-top overflow-auto rounded-2xl border border-purple/15 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out ${open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'}`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-1.5 right-1.5 rounded-xl bg-purple/25 transition-[top,height,opacity] duration-200 ease-out"
          style={{ top: bar?.top ?? 0, height: bar?.height ?? 0, opacity: bar ? 1 : 0 }}
        />
        {options.map((o, i) => {
          const selected = o.value === value
          return (
            <li
              key={o.value}
              ref={(el) => { itemRefs.current[i] = el }}
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
              className={`relative z-10 flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-base transition-colors duration-200 ${selected ? 'font-semibold text-purple' : active === i ? 'font-medium text-purple' : 'text-foreground/85'}`}
            >
              <span>{o.label}</span>
              {selected && <Check className="h-4 w-4" strokeWidth={3} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
