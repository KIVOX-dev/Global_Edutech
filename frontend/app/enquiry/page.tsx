import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import EnquiryFromQuery from '../../components/EnquiryFromQuery'
import LogoMarquee from '../../components/LogoMarquee'

export const metadata = {
  title: 'Enquire Now | Global Edutech',
  description: 'Send an enquiry to Global Edutech. We will call you back to plan the right program for your child.',
}

export default function EnquiryPage() {
  return (
    <main className="min-h-screen bg-purpleLight/50">
      <Header />
      <section className="px-4 py-8 sm:py-10 lg:py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center lg:mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-pink sm:text-sm lg:mb-0">Free consultation</p>
            <h1 className="font-display text-3xl font-bold text-purple md:text-4xl lg:text-3xl">Enquire Now</h1>
            <p className="mx-auto mt-3 max-w-2xl text-foreground/80 lg:mt-1 lg:text-sm">Tell us about your child and we will call you back with the right program, timings and a free demo class.</p>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl bg-white p-5 shadow-xl ring-1 ring-purple/10 sm:p-8 lg:p-5">
                <EnquiryFromQuery />
              </div>
              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6 lg:mt-3">
                <p className="text-center text-sm text-foreground/70">
                  Prefer to talk? Call <a className="font-semibold text-purple" href="tel:+919363042019">+91 93630 42019</a> (Mon-Sat, 9am-6pm)
                </p>
                <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-purple px-6 text-sm font-bold text-purple transition hover:bg-purple hover:text-white lg:h-9">
                  <ArrowLeft className="h-4 w-4" /> Back to home
                </Link>
              </div>
            </div>
            <aside className="relative order-1 lg:order-2 lg:min-h-[30rem]"><LogoMarquee /></aside>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
