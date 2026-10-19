'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import HeroCarousel from '@/components/HeroCarousel';

type Stat = {
  value?: string;
  label: string;
  ringClass: string; // e.g., "ring-yellow"
};

const heroStats: Stat[] = [
  { value: '19', label: 'Years of Experience', ringClass: 'ring-yellow' },
  { value: '10,000+', label: 'Families Served', ringClass: 'ring-pink' },
  { label: '30+ Courses', ringClass: 'ring-accent' },
  { label: 'Effective Coaching', ringClass: 'ring-purple' },
];

function HeroStats() {
  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      {/* 2x2 grid for all screens for better text accommodation */}
      <div className="grid grid-cols-1 xs:grid-cols-2 grid-rows-auto xs:grid-rows-2 items-stretch gap-3 sm:gap-4">
        {heroStats.map((s, i) => (
          <Card
            key={i}
            className={`h-full min-h-0 rounded-md bg-white/90 shadow-gentle ring-2 ${s.ringClass} transition`}
          >
            <CardContent className="flex h-full flex-col items-center justify-center p-2 xs:px-3 xs:py-4 sm:py-5 text-center min-w-0">
              {s.value ? (
                <div className="text-lg xs:text-xl font-bold leading-none text-pink break-words sm:text-2xl md:text-3xl lg:text-4xl">{s.value}</div>
              ) : null}
              <div
                className={`mt-1 font-semibold leading-snug text-primary break-words ${
                  s.value
                    ? 'text-xs sm:text-sm md:text-base lg:text-lg'
                    : 'text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl'
                }`}
                style={{ wordBreak: 'break-word', hyphens: 'auto' }}
              >
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-hero-gradient section-padding text-white"
      aria-label="Global Edutech Hero"
    >
      <div className="container-custom grid items-center gap-10 lg:grid-cols-2">
        {/* Left: Text */}
        <div className="mx-auto max-w-2xl text-center lg:text-left">
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Empower Young Minds with <span className="text-yellow">Global Edutech</span>
          </h1>

          <p className="mt-4 text-lg text-white/90 md:text-xl font-bold">
            Preschool, after-school & weekend programs that blend play with proven pedagogy.
          </p>

          {/* Equal-size stats grid */}
          <HeroStats />

          {/* CTAs */}
          <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 sm:gap-4 sm:flex-row lg:justify-start w-full max-w-2xl mx-auto">
            <Button
              asChild
              variant="heroEnrollNow"
              className="w-full xs:w-4/5 sm:w-1/2"
            >
              <a href="#contact" aria-label="Enroll Now">
                <span className="inline-flex items-center gap-2 w-full justify-center">
                  <span role="img" aria-label="Star">🌟</span> Enroll Now
                </span>
              </a>
            </Button>

            <Button
              asChild
              className="btn-large bg-pink hover:bg-pink/90 text-white border-2 border-pink shadow-lg font-bold w-full xs:w-4/5 sm:w-1/2"
            >
              <a href="#services" aria-label="Explore our programs">
                <span className="inline-flex items-center gap-2 w-full justify-center">
                  <span role="img" aria-label="Book">📚</span> Explore Programs
                </span>
              </a>
            </Button>
          </div>
        </div>

        {/* Right: Visual with Carousel */}
        <motion.div
          className="relative mx-auto w-full max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative h-80 w-full rounded-3xl bg-white/20 p-3 shadow-[inset_0_6px_24px_rgba(0,0,0,0.12)] ring-4 ring-white/40 backdrop-blur-md md:h-96">
            <HeroCarousel />
          </div>

          {/* Subtle floating accents (motion-safe only) */}
          <div
            aria-hidden="true"
            className="motion-safe:animate-float absolute -top-4 -right-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple shadow-lg"
          >
            <span className="text-2xl">🌟</span>
          </div>
          {/* <div
            aria-hidden="true"
            className="motion-safe:animate-float-medium absolute -bottom-4 -left-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink shadow-lg"
          >
            <span className="text-xl">🚀</span>
          </div> */}
        </motion.div>
      </div>
      
      {/* Logo chips (moved outside the grid for better responsive layout) */}
      <div className="mt-10">
        <div className="mx-auto flex flex-wrap justify-center gap-4 sm:gap-6">
          <div className="flex h-16 sm:h-24 w-24 sm:w-32 flex-col items-center rounded-md justify-center bg-white shadow-md ring-2 ring-yellow" aria-hidden="true">
            <Image src="/images/globalkids.png" alt="Global Kids Logo" width={48} height={48} className="sm:w-16 sm:h-16" />
          </div>
          <div className="flex h-16 sm:h-24 w-24 sm:w-32 flex-col items-center rounded-md justify-center bg-white shadow-md ring-2 ring-accent" aria-hidden="true">
            <Image src="/images/globaleducation.png" alt="Global Education Logo" width={48} height={48} className="sm:w-16 sm:h-16" />
          </div>
          <div className="flex h-16 sm:h-24 w-24 sm:w-32 flex-col items-center rounded-md justify-center bg-white shadow-md ring-2 ring-pink" aria-hidden="true">
            <Image src="/images/globalacademy.png" alt="Global Academy Logo" width={48} height={48} className="sm:w-16 sm:h-16" />
          </div>
        </div>
      </div>
    </section>
  );
}
