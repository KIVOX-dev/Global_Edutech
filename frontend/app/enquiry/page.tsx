import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import EnquiryForm from '../../components/EnquiryForm'

export const metadata = {
  title: 'Enquire Now | Global Edutech',
  description: 'Send an enquiry to Global Edutech. We will call you back to plan the right program for your child.',
}

export default function EnquiryPage() {
  return (
    <main className="min-h-screen bg-purpleLight/50">
      <Header />
      <section className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-pink">Free consultation</p>
            <h1 className="font-display text-3xl font-bold text-purple md:text-4xl">Enquire Now</h1>
            <p className="mt-3 text-foreground/80">Tell us about your child and we will call you back with the right program, timings and a free demo class.</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-xl ring-1 ring-purple/10 sm:p-8">
            <EnquiryForm />
          </div>
          <p className="mt-6 text-center text-sm text-foreground/70">
            Prefer to talk? Call <a className="font-semibold text-purple" href="tel:+919363042019">+91 93630 42019</a> (Mon-Sat, 9am-6pm) · <Link href="/" className="underline">Back to home</Link>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
