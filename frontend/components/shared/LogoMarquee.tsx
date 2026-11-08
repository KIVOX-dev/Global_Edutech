import Image from 'next/image'

const LOGOS = [
  { src: '/images/abacus.png', alt: 'Global Abacus' },
  { src: '/images/handwriting.png', alt: 'Global Handwriting' },
  { src: '/images/arts.png', alt: 'Global Arts' },
  { src: '/images/english.png', alt: 'Global English' },
  { src: '/images/vedicmaths.png', alt: 'Global Vedic Maths' },
  { src: '/images/globalkids.png', alt: 'Global Kids' },
  { src: '/images/globaleducation.png', alt: 'Global Education' },
  { src: '/images/tuitionpoint.png', alt: 'Tuition Point' },
]

function Card({ src, alt, hidden }: { src: string; alt: string; hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex h-32 w-52 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-gentle ring-1 ring-purple/10 lg:h-36 lg:w-full">
      <Image src={src} alt={hidden ? '' : alt} width={420} height={300} quality={100} loading="eager" className="h-full w-full object-contain" />
    </div>
  )
}

// Logos that keep running: top to bottom on desktop (side panel), left on phones (strip)
export default function LogoMarquee() {
  const list = [...LOGOS, ...LOGOS]
  return (
    <>
      {/* Desktop: vertical, fades at the top and bottom */}
      <div className="marquee-pause absolute inset-0 hidden overflow-hidden rounded-3xl bg-white/60 p-4 shadow-xl ring-1 ring-purple/10 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)] lg:block" aria-label="Our programs">
        <div className="marquee-v flex flex-col gap-4">
          {list.map((l, i) => <Card key={i} {...l} hidden={i >= LOGOS.length} />)}
        </div>
      </div>
      {/* Phones and tablets: horizontal strip */}
      <div className="marquee-pause relative overflow-hidden rounded-2xl bg-white/60 py-3 ring-1 ring-purple/10 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] lg:hidden" aria-label="Our programs">
        <div className="marquee-h flex w-max gap-3 px-3">
          {list.map((l, i) => <Card key={i} {...l} hidden={i >= LOGOS.length} />)}
        </div>
      </div>
    </>
  )
}
