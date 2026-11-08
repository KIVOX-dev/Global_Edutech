import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import ContactSection from '@/components/home/ContactSection'
import GalleryPreview from '@/components/gallery/GalleryPreview'
import { Toaster } from '@/components/ui/toaster'
import {
  BrandStrip, CourseGrid, HomeHero, ProgramsGrid, StressFree, TeacherBanner, TopBar, VisitBanner, WhyBest,
} from '@/components/home/HomeSections'

export default function Home() {
  return (
    <main className="min-h-screen">
      <TopBar />
      <Header />
      <HomeHero />
      <BrandStrip />
      <ProgramsGrid />
      <WhyBest />
      <StressFree />
      <CourseGrid />
      <TestimonialsSection />
      <GalleryPreview />
      <TeacherBanner />
      <VisitBanner />
      <ContactSection />
      <Footer />
      <Toaster />
    </main>
  )
}
