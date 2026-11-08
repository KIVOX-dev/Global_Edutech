'use client'

import { useId, useState } from 'react'

export type TrendPoint = { date: string; percentage: number | null; present?: number; late?: number; absent?: number; excused?: number }

const shortDate = (d: string) => {
  const [, m, day] = d.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${Number(day)} ${months[Number(m) - 1]}`
}

// Attendance % over time: smooth area + line, tap or hover a point for the day's numbers
export function TrendChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = height
  const pad = { l: 34, r: 14, t: 14, b: 30 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const n = data.length
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / 100) * ih
  const pts = data.map((d, i) => (d.percentage === null ? null : { i, x: x(i), y: y(d.percentage), v: d.percentage }))
  const real = pts.filter((p): p is { i: number; x: number; y: number; v: number } => p !== null)

  if (real.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No attendance has been marked in this period yet.</p>
  }

  // smooth path through the points that have data
  const line = real.map((p, k) => {
    if (k === 0) return `M ${p.x} ${p.y}`
    const prev = real[k - 1]
    const cx = (prev.x + p.x) / 2
    return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }).join(' ')
  const area = `${line} L ${real[real.length - 1].x} ${pad.t + ih} L ${real[0].x} ${pad.t + ih} Z`
  const active = hover !== null ? pts[hover] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Attendance percentage trend">
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff73ad" stopOpacity="0.45" /><stop offset="1" stopColor="#763dcb" stopOpacity="0.03" /></linearGradient>
          <linearGradient id={`line-${gid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff5fa8" /><stop offset="1" stopColor="#763dcb" /></linearGradient>
        </defs>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="#e5e0f2" strokeDasharray={g === 0 ? undefined : '4 5'} />
            <text x={pad.l - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#8a82a3">{g}%</text>
          </g>
        ))}
        <path d={area} fill={`url(#area-${gid})`} />
        <path d={line} fill="none" stroke={`url(#line-${gid})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (i % Math.ceil(n / 7) === 0 || i === n - 1) && (
          <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#8a82a3">{shortDate(d.date)}</text>
        ))}
        {real.map((p) => (
          <circle key={p.i} cx={p.x} cy={p.y} r={hover === p.i ? 7 : 4.5} fill="#fff" stroke="#763dcb" strokeWidth="3" className="transition-all" />
        ))}
        {/* wide invisible targets so a finger can pick a point */}
        {data.map((d, i) => (
          <rect key={d.date} x={x(i) - iw / Math.max(n, 1) / 2} y={pad.t} width={iw / Math.max(n, 1)} height={ih + 10} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i === hover ? null : i)} />
        ))}
      </svg>
      {active && hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-xl bg-[#2d1466] px-3 py-2 text-center text-xs text-white shadow-lg">
          <p className="font-semibold">{shortDate(data[hover].date)}: {active.v}%</p>
          <p className="opacity-80">P {data[hover].present} · L {data[hover].late} · A {data[hover].absent} · E {data[hover].excused}</p>
        </div>
      )}
    </div>
  )
}

export type Slice = { label: string; value: number; color: string }

// Donut with the share of students in each status and a legend
export function Donut({ slices, centerLabel, centerValue }: { slices: Slice[]; centerLabel: string; centerValue: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eee9f8" strokeWidth="16" />
        {total > 0 && slices.filter((s) => s.value > 0).map((s) => {
          const len = (s.value / total) * c
          const el = (
            <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" strokeLinecap="butt" />
          )
          offset += len
          return el
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="24" fontWeight="700" fill="#2d1466">{centerValue}</text>
        <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#8a82a3">{centerLabel}</text>
      </svg>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.label}</span>
            <span className="font-semibold">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
