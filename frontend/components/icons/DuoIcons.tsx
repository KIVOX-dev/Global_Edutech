import type { ReactNode } from 'react'

// Duotone line icons: deep-purple outline, "hypershade" pink-to-purple fill, pink "+" spark.
// Replaces emojis across the site. All icons share one 64x64 grid.

const INK = '#2d1466'
const SPARK = '#ff3d8b'

function Svg({ children, className = 'h-12 w-12', spark = true, title }: { children: ReactNode; className?: string; spark?: boolean; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id="hs-dark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff73ad" /><stop offset="1" stopColor="#763dcb" /></linearGradient>
        <linearGradient id="hs-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe066" /><stop offset="0.55" stopColor="#ffc107" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
        <linearGradient id="hs-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd3e6" /><stop offset="1" stopColor="#d8c6ff" /></linearGradient>
      </defs>
      {children}
      {spark && <path d="M53 6v10M48 11h10" stroke={SPARK} />}
    </svg>
  )
}
const D = 'url(#hs-dark)'
const L = 'url(#hs-light)'
type P = { className?: string; title?: string; spark?: boolean }

export const ChildIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="32" cy="35" r="16" fill={L} />
    <path d="M16 33c0-11 7-17 16-17s16 6 16 17c-6-2-10-6-12-10-4 5-11 9-20 10z" fill={D} />
    <circle cx="25.5" cy="37" r="1.6" fill={INK} /><circle cx="38.5" cy="37" r="1.6" fill={INK} />
    <path d="M26 43c3 3 9 3 12 0" />
  </Svg>
)

export const BulbIcon = (p: P) => (
  <Svg {...p}>
    <path d="M32 10a15 15 0 0 0-8 27c2 2 3 4 3 7h10c0-3 1-5 3-7a15 15 0 0 0-8-27z" fill={D} />
    <path d="M27 50h10M29 55h6M28 31l4-5 4 5" />
  </Svg>
)

export const MicIcon = (p: P) => (
  <Svg {...p}>
    <rect x="24" y="8" width="16" height="28" rx="8" fill={D} />
    <path d="M28 18h8M28 24h8M17 30a15 15 0 0 0 30 0M32 45v10M24 55h16" />
  </Svg>
)

export const PuzzleIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 22h12a6 6 0 1 1 12 0h12v12a6 6 0 1 0 0 12v10H38a6 6 0 1 0-12 0H14V46a6 6 0 1 1 0-12z" fill={D} />
  </Svg>
)

export const TargetIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="30" cy="34" r="20" fill={L} /><circle cx="30" cy="34" r="12" fill={D} /><circle cx="30" cy="34" r="3.5" fill={INK} />
    <path d="M30 34l20-20M43 12l7 1 1 7" />
  </Svg>
)

export const BookIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 16c8-3 16-3 24 2 8-5 16-5 24-2v34c-8-3-16-3-24 2-8-5-16-5-24-2z" fill={D} />
    <path d="M32 18v34M14 26c4-1 8-1 12 1M14 34c4-1 8-1 12 1" />
  </Svg>
)

export const HomeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M10 30L32 10l22 20v22H10z" fill={D} />
    <rect x="26" y="37" width="12" height="15" rx="2" fill={L} />
  </Svg>
)

export const ClockIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="32" cy="34" r="22" fill={D} /><circle cx="32" cy="34" r="16" fill={L} />
    <path d="M32 24v10l8 5" />
  </Svg>
)

// Golden star with a live yellow "hypershade" flowing inside it (CSS gradient, no SVG ids, so it renders the same everywhere)
export const StarIcon = ({ className = 'h-12 w-12', title }: P) => (
  <span className={`relative inline-block shrink-0 ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <span className="star-fill absolute inset-0" style={{ clipPath: 'polygon(50.00% 12.50%, 61.72% 36.72%, 88.28% 40.47%, 69.06% 59.22%, 73.75% 85.78%, 50.00% 72.66%, 26.25% 85.78%, 30.94% 59.22%, 11.72% 40.47%, 38.28% 36.72%)' }} />
    <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 8l7.5 15.5 17 2.4-12.3 12 3 17L32 46.5 16.8 54.9l3-17-12.3-12 17-2.4z" />
    </svg>
  </span>
)

export const CapIcon = (p: P) => (
  <Svg {...p}>
    <path d="M32 14L6 26l26 12 26-12z" fill={D} />
    <path d="M16 32v12c0 4 8 8 16 8s16-4 16-8V32M58 26v16" />
  </Svg>
)

export const PencilIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 52l4-14L42 12l10 10-26 26z" fill={D} />
    <path d="M38 16l10 10M12 52l12-4" />
  </Svg>
)

// White rounded tile that holds an icon so it reads well on coloured backgrounds
export function IconTile({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ${className}`}>{children}</span>
}
