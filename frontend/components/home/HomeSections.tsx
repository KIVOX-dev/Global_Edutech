'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Phone, Sparkles } from 'lucide-react'
import { courses } from '@/lib/courses-data'
import HeroCarousel from '@/components/HeroCarousel'
import { blendStyle } from '@/lib/image-blend'
import { BookIcon, BulbIcon, CapIcon, ChildIcon, ClockIcon, HomeIcon, IconTile, MicIcon, PuzzleIcon, StarIcon } from '@/components/icons/DuoIcons'

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }

function Heading({ kicker, title, sub, light }: { kicker?: string; title: string; sub?: string; light?: boolean }) {
  return (
    <motion.div {...fade} className="mx-auto mb-10 max-w-3xl text-center">
      {kicker && <p className={`mb-2 text-sm font-semibold uppercase tracking-widest ${light ? 'text-yellow' : 'text-pink'}`}>{kicker}</p>}
      <h2 className={`font-display text-3xl font-bold md:text-4xl ${light ? 'text-white' : 'text-purple'}`}>{title}</h2>
      {sub && <p className={`mt-3 text-lg ${light ? 'text-white/90' : 'text-foreground/75'}`}>{sub}</p>}
    </motion.div>
  )
}

/* 1. Utility bar (like the top strip on the reference site) */
export function TopBar() {
  return (
    <div className="hypershade text-white">
      <div className="container-custom relative z-10 flex flex-wrap items-center justify-between gap-2 py-2 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow" /> Preschool · After-School · Home Tuition</span>
        <span className="flex items-center gap-4">
          <a href="tel:+919363042019" className="inline-flex items-center gap-1 hover:text-yellow"><Phone className="h-3.5 w-3.5" /> +91 93630 42019</a>
          <Link href="/courses" className="hidden hover:text-yellow sm:inline">All courses</Link>
        </span>
      </div>
    </div>
  )
}

/* 2. Hero: big headline, two CTAs, rounded photo carousel */
export function HomeHero() {
  const stats = [
    { v: '19', l: 'Years of experience', c: 'hs-card hs-amber text-white' },
    { v: '10,000+', l: 'Families served', c: 'hs-card hs-rose text-white' },
    { v: '30+', l: 'Courses & programs', c: 'hs-card hs-violet text-white' },
  ]
  return (
    <section id="home" className="relative overflow-hidden bg-hero-gradient text-white">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-accent-light/40 blur-3xl" />
      <div className="container-custom relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <motion.div {...fade}>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-sm font-semibold backdrop-blur"><StarIcon className="h-6 w-6" spark={false} /> Trusted by thousands of families</p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Where Young Minds <span className="text-yellow">Love to Learn</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 md:text-xl">
            Global Edutech blends play with proven teaching, from preschool to after-school skills and home tuition up to Class 10.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="/enquiry" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow px-7 font-bold text-purple shadow-lg transition hover:scale-105">Book a Free Demo <ArrowRight className="h-4 w-4" /></a>
            <a href="#programs" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white px-7 font-bold text-white transition hover:bg-white hover:text-purple">Explore Programs</a>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.l} className={`rounded-2xl p-3 text-center shadow-gentle ${s.c}`}>
                <p className="font-display text-xl font-bold text-white drop-shadow-md sm:text-2xl">{s.v}</p>
                <p className="text-[11px] font-semibold leading-tight sm:text-xs">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div {...fade} className="relative mx-auto w-full max-w-xl">
          <div className="relative h-80 rounded-[2rem] bg-white/20 p-3 ring-4 ring-white/40 backdrop-blur-md md:h-[26rem]"><HeroCarousel /></div>
          <div aria-hidden className="motion-safe:animate-float absolute -right-3 -top-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg"><StarIcon className="h-11 w-11" spark={false} /></div>
        </motion.div>
      </div>
    </section>
  )
}

/* 3. "Trusted" strip with the three brand logos */
export function BrandStrip() {
  const logos = [
    { src: '/images/globalkids.png', alt: 'Global Kids', ring: 'ring-yellow' },
    { src: '/images/globaleducation.png', alt: 'Global Education', ring: 'ring-accent' },
    { src: '/images/globalacademy.png', alt: 'Global Academy', ring: 'ring-pink' },
    { src: '/images/tuitionpoint.png', alt: 'Tuition Point', ring: 'ring-purple' },
  ]
  return (
    <section className="bg-purpleLight py-8">
      <div className="container-custom text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-purple">One family of learning brands</p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {logos.map((l) => (
            <div key={l.alt} className={`flex h-28 w-40 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md ring-2 ${l.ring} sm:h-36 sm:w-52`}>
              <Image src={l.src} alt={l.alt} width={400} height={400} quality={100} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 5. Programs grid (reference: "CBSE Syllabus" four cards) */
const PROGRAMS = [
  { Icon: CapIcon, title: 'Global Kids', sub: 'Preschool · Ages 2-6', text: 'Play-based early learning with phonics, number sense, art and social skills.', tone: 'bg-yellow/30 ring-yellow' },
  { Icon: BookIcon, title: 'Global Education', sub: 'After-School · Ages 5-12', text: 'Abacus, Vedic maths, handwriting, English, art, chess and more after school.', tone: 'bg-pink/15 ring-pink' },
  { Icon: HomeIcon, title: 'Tuition Point', sub: 'Home Tuitions · Class 1-10', text: 'Verified tutors teach one-to-one at your doorstep, at your pace.', tone: 'bg-accent-light/30 ring-accent' },
  { Icon: ClockIcon, title: 'Weekend & Skill Camps', sub: 'Flexible batches', text: 'Weekday and weekend batches so learning fits around school and family.', tone: 'bg-purple/10 ring-purple' },
]
export function ProgramsGrid() {
  return (
    <section id="programs" className="section-padding bg-white">
      <div className="container-custom">
        <Heading kicker="Our programs" title="Learning for Every Age and Stage" sub="Four ways to learn with Global Edutech, from first steps to Class 10." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map((p, i) => (
            <motion.div key={p.title} {...fade} transition={{ duration: 0.5, delay: i * 0.08 }} className={`rounded-3xl p-6 text-center shadow-gentle ring-2 ${p.tone}`}>
              <IconTile className="mb-4 h-20 w-20 ring-2 ring-purple/10"><p.Icon className="h-14 w-14" /></IconTile>
              <h3 className="font-display text-xl font-bold text-purple">{p.title}</h3>
              <p className="mt-1 text-sm font-semibold text-pink">{p.sub}</p>
              <p className="mt-3 text-sm text-foreground/80">{p.text}</p>
              <Link href="/enquiry" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple text-sm font-bold text-white shadow-md transition hover:bg-purple/90">Know more <ArrowRight className="h-4 w-4" /></Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 6. Why us (reference: "Why we are the Best") bullets + photo */
const WHY = [
  'Personalised learning path for every child',
  'Experienced, certified educators',
  'Professional tutoring at your doorstep',
  'Holistic growth: academics, creativity and confidence',
  '98% of students show measurable improvement within 3 months',
  'Safe, secure environment with transparent communication',
]
export function WhyBest() {
  return (
    <section id="why-choose-us" className="section-padding bg-purpleLight">
      <div className="container-custom grid items-center gap-10 lg:grid-cols-2">
        <motion.div {...fade}>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-pink">Why Global Edutech</p>
          <h2 className="font-display text-3xl font-bold text-purple md:text-4xl">Why Families Choose Us</h2>
          <ul className="mt-6 space-y-3">
            {WHY.map((w) => (
              <li key={w} className="flex items-start gap-3 text-lg">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>{w}
              </li>
            ))}
          </ul>
          <a href="/enquiry" className="mt-7 inline-flex h-12 items-center rounded-xl bg-purple px-7 font-bold text-white shadow-lg transition hover:bg-purple/90">Talk to us</a>
        </motion.div>
        <motion.div {...fade} className="grid grid-cols-2 gap-4">
          <div className="relative col-span-2 aspect-[16/11] overflow-hidden rounded-3xl bg-white ring-4 ring-yellow"><Image src="/images/globalacademy-all.jpeg" alt="Global Academy after school activities hub" fill quality={100} className="object-contain" style={blendStyle('/images/globalacademy-all.jpeg')} sizes="(max-width:1024px) 100vw, 40vw" /></div>
          <div className="relative aspect-[945/660] overflow-hidden rounded-3xl bg-white ring-4 ring-pink"><Image src="/images/arts.png" alt="Global Arts" fill quality={100} className="object-contain" sizes="(max-width:1024px) 50vw, 25vw" /></div>
          <div className="relative aspect-[945/660] overflow-hidden rounded-3xl bg-white ring-4 ring-purple"><Image src="/images/abacus.png" alt="Global Abacus" fill quality={100} className="object-contain" sizes="(max-width:1024px) 50vw, 25vw" /></div>
        </motion.div>
      </div>
    </section>
  )
}

/* 7. Stress-free learning (reference: "What is Stress Free School") */
const PILLARS = [
  { Icon: ChildIcon, t: 'Child-centric methods', d: 'Lessons adapt to how each child learns best.' },
  { Icon: BulbIcon, t: 'Concept-based learning', d: 'Understand the why, not just memorise the how.' },
  { Icon: MicIcon, t: 'Language mastery', d: 'English, Hindi and Tamil handwriting and speaking.' },
  { Icon: PuzzleIcon, t: 'Learning through play', d: 'Puzzles, chess, cubes and art keep minds curious.' },
]
export function StressFree() {
  return (
    <section className="section-padding bg-hero-gradient text-white">
      <div className="container-custom">
        <Heading light kicker="Our approach" title="Learning Without the Stress" sub="Happy children learn faster. Everything we teach is designed to build confidence first." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <motion.div key={p.t} {...fade} className="rounded-3xl bg-white/15 p-6 text-center backdrop-blur ring-1 ring-white/30">
              <IconTile className="h-20 w-20"><p.Icon className="h-14 w-14" /></IconTile>
              <h3 className="mt-3 font-display text-lg font-bold">{p.t}</h3>
              <p className="mt-2 text-sm text-white/90">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 8. Core courses: only the main programs (sub-courses like Phonics or Chess live on /courses) */
const CORE = ['abacus', 'handwriting', 'arts', 'english', 'vedic-maths']
const ACCENTS = ['border-t-yellow', 'border-t-pink', 'border-t-accent', 'border-t-purple', 'border-t-yellow']
export function CourseGrid() {
  const list = CORE.map((slug) => courses.find((c) => c.slug === slug)).filter((c): c is (typeof courses)[number] => !!c)
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <Heading kicker="Our courses" title="Our Core Courses" sub="Proven programs that build focus, language and confidence. Tap one to see what your child will learn." />
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {list.map((c, i) => (
            <motion.div key={c.slug} {...fade} transition={{ duration: 0.5, delay: i * 0.06 }} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)]">
              <Link href={`/courses/${c.slug}`} className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 bg-white text-center shadow-gentle transition hover:-translate-y-1 hover:shadow-xl ${ACCENTS[i % ACCENTS.length]}`}>
                <span className="relative block aspect-[945/660] w-full bg-white">
                  <Image src={c.imageUrl} alt={`${c.title} logo`} fill quality={100} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition duration-300 group-hover:scale-105" />
                </span>
                <span className="flex flex-1 flex-col items-center p-4">
                  <span className="font-display text-base font-bold leading-snug text-purple sm:text-lg">{c.title}</span>
                  <span className="mt-2 rounded-full bg-yellow/40 px-3 py-0.5 text-xs font-semibold text-purple">{c.details.ageGroup}</span>
                  <span className="mt-auto w-full pt-4"><span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-pink text-sm font-bold text-white shadow-md transition group-hover:bg-purple">Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/courses" className="inline-flex h-12 items-center rounded-xl border-2 border-purple px-7 font-bold text-purple transition hover:bg-purple hover:text-white">View all courses</Link></div>
      </div>
    </section>
  )
}

/* 9. Teacher training banner (reference: "Careers, not jobs") */
export function TeacherBanner() {
  return (
    <section className="bg-yellow/30 py-12">
      <div className="container-custom flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
        <div>
          <h2 className="font-display text-2xl font-bold text-purple md:text-3xl">We Build Careers in Teaching</h2>
          <p className="mt-2 max-w-2xl text-foreground/80">Train with our teacher-training programs (IMTTI and NTT) and grow into a confident early-years educator.</p>
        </div>
        <Link href="/courses/ntt" className="inline-flex h-12 shrink-0 items-center rounded-xl bg-purple px-7 font-bold text-white shadow-lg transition hover:bg-purple/90">View Teacher Training</Link>
      </div>
    </section>
  )
}

/* 10. Tour banner (reference: "Want to Explore the Peepal Environment?") */
export function VisitBanner() {
  return (
    <section className="bg-cta-gradient py-14 text-center text-white">
      <div className="container-custom">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Want to See Global Edutech in Action?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-white/95">Visit a class, meet our teachers and watch your child try a free demo session.</p>
        <a href="/enquiry" className="mt-7 inline-flex h-14 items-center gap-2 rounded-xl bg-yellow px-8 text-lg font-bold text-purple shadow-xl transition hover:scale-105">Schedule My Free Demo <ArrowRight className="h-5 w-5" /></a>
      </div>
    </section>
  )
}

