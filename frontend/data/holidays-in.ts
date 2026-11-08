// Built-in Indian government holidays for an institute in Tamil Nadu (Central gazetted + Tamil Nadu government holidays).
// Fixed-date holidays repeat every year. Festival dates move each year, so they are listed per year only where known.
// Moon-sighting festivals (Id-ul-Fitr, Bakrid, Muharram, Milad-un-Nabi) can shift by a day: the admin reviews the list before importing.

export type GovHoliday = { date: string; title: string; source: 'Central' | 'Tamil Nadu' | 'Both'; approx?: boolean }

const FIXED: { md: string; title: string; source: GovHoliday['source'] }[] = [
  { md: '01-01', title: "New Year's Day", source: 'Tamil Nadu' },
  { md: '01-26', title: 'Republic Day', source: 'Both' },
  { md: '04-14', title: 'Tamil New Year / Dr. Ambedkar Jayanti', source: 'Tamil Nadu' },
  { md: '05-01', title: 'May Day', source: 'Both' },
  { md: '08-15', title: 'Independence Day', source: 'Both' },
  { md: '10-02', title: 'Gandhi Jayanti', source: 'Both' },
  { md: '12-25', title: 'Christmas', source: 'Both' },
]

// Festival dates by year (2026 list). Add further years here when the government publishes the calendar.
const MOVABLE: Record<number, GovHoliday[]> = {
  2026: [
    { date: '2026-01-15', title: 'Pongal', source: 'Tamil Nadu' },
    { date: '2026-01-16', title: 'Thiruvalluvar Day', source: 'Tamil Nadu' },
    { date: '2026-01-17', title: 'Uzhavar Thirunal', source: 'Tamil Nadu' },
    { date: '2026-02-01', title: 'Thai Poosam', source: 'Tamil Nadu' },
    { date: '2026-03-04', title: 'Holi', source: 'Central' },
    { date: '2026-03-19', title: 'Telugu New Year (Ugadi)', source: 'Tamil Nadu' },
    { date: '2026-03-21', title: 'Id-ul-Fitr (Ramzan)', source: 'Both', approx: true },
    { date: '2026-03-26', title: 'Ram Navami', source: 'Central' },
    { date: '2026-03-31', title: 'Mahavir Jayanti', source: 'Both' },
    { date: '2026-04-03', title: 'Good Friday', source: 'Both' },
    { date: '2026-05-27', title: 'Id-ul-Zuha (Bakrid)', source: 'Both', approx: true },
    { date: '2026-06-26', title: 'Muharram', source: 'Both', approx: true },
    { date: '2026-08-26', title: 'Milad-un-Nabi', source: 'Both', approx: true },
    { date: '2026-09-04', title: 'Krishna Jayanthi (Janmashtami)', source: 'Both' },
    { date: '2026-09-14', title: 'Vinayagar Chathurthi', source: 'Tamil Nadu' },
    { date: '2026-10-19', title: 'Ayudha Pooja', source: 'Tamil Nadu' },
    { date: '2026-10-20', title: 'Vijayadasami (Dussehra)', source: 'Both' },
    { date: '2026-11-08', title: 'Deepavali', source: 'Both' },
    { date: '2026-11-24', title: 'Guru Nanak Jayanti', source: 'Central' },
  ],
}

export const hasFestivalDates = (year: number) => !!MOVABLE[year]

export function holidaysForYear(year: number): GovHoliday[] {
  const fixed: GovHoliday[] = FIXED.map((f) => ({ date: `${year}-${f.md}`, title: f.title, source: f.source }))
  const all = [...fixed, ...(MOVABLE[year] || [])].sort((a, b) => a.date.localeCompare(b.date))
  // two holidays on one day become a single entry (e.g. May Day and Buddha Purnima)
  const merged = new Map<string, GovHoliday>()
  for (const h of all) {
    const prev = merged.get(h.date)
    merged.set(h.date, prev ? { ...prev, title: `${prev.title} / ${h.title}`, approx: prev.approx || h.approx } : h)
  }
  return Array.from(merged.values())
}
