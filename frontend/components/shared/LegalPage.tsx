import Link from 'next/link'
import Header from './Header'
import Footer from './Footer'

export type LegalSection = { id: string; title: string; body: (string | { list: string[] })[] }

export const LEGAL_UPDATED = '8 November 2026'

// Shared layout for the Privacy Policy and Terms of Service pages
export default function LegalPage({ title, intro, sections, other }: {
  title: string
  intro: string
  sections: LegalSection[]
  other: { href: string; label: string }
}) {
  return (
    <main className="min-h-screen bg-purpleLight/40">
      <Header />
      <section className="hypershade text-white">
        <div className="container-custom relative z-10 py-10 text-center md:py-14">
          <h1 className="font-display text-3xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-3 text-white/90">Last updated: {LEGAL_UPDATED}</p>
        </div>
      </section>

      <div className="container-custom grid gap-8 py-10 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <details className="rounded-2xl bg-white p-4 shadow-gentle ring-1 ring-purple/10 lg:open:block" open>
            <summary className="cursor-pointer font-display font-bold text-purple lg:pointer-events-none">Contents</summary>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}><a href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-foreground/80 hover:bg-purpleLight hover:text-purple">{i + 1}. {s.title}</a></li>
              ))}
            </ol>
          </details>
        </nav>

        <article className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-purple/10 sm:p-10">
          <p className="mb-8 text-lg leading-relaxed text-foreground/85">{intro}</p>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="mb-9 scroll-mt-24">
              <h2 className="mb-3 font-display text-xl font-bold text-purple md:text-2xl">{i + 1}. {s.title}</h2>
              <div className="space-y-3 leading-relaxed text-foreground/85">
                {s.body.map((b, j) =>
                  typeof b === 'string' ? <p key={j}>{b}</p> : (
                    <ul key={j} className="list-disc space-y-1.5 pl-6 marker:text-pink">{b.list.map((li) => <li key={li}>{li}</li>)}</ul>
                  ),
                )}
              </div>
            </section>
          ))}
          <div className="mt-10 flex flex-wrap gap-3 border-t pt-6">
            <Link href={other.href} className="inline-flex h-11 items-center rounded-xl border-2 border-purple px-6 font-bold text-purple transition hover:bg-purple hover:text-white">{other.label}</Link>
            <Link href="/enquiry" className="inline-flex h-11 items-center rounded-xl bg-purple px-6 font-bold text-white transition hover:bg-purple/90">Contact us</Link>
          </div>
        </article>
      </div>
      <Footer />
    </main>
  )
}
