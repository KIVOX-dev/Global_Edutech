import Header from '../components/Header'
import Footer from '../components/Footer'
import TestimonialsSection from '../components/TestimonialsSection'
import ContactSection from '../components/ContactSection'
import GalleryPreview from '../components/GalleryPreview'
import { Toaster } from '@/components/ui/toaster'
import {
  BrandStrip, CourseGrid, HomeHero, ProgramsGrid, StressFree, TeacherBanner, TopBar, VisitBanner, WhyBest,
} from '../components/home/HomeSections'

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
