import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import WhyChooseUs from '../components/WhyChooseUs'
import ServicesSection from '../components/ServicesSection'
import TestimonialsSection from '../components/TestimonialsSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import CoursesTabs from '../components/CoursesTabs'
import GalleryPreview from '../components/GalleryPreview'
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />
      {/* A - Attention: Hero Section */}
      <HeroSection />
      {/* I - Interest: Why Choose Us */}
        <WhyChooseUs />
      {/* D - Desire: Services, Courses & Testimonials */}
        <TestimonialsSection />
        <ServicesSection />
        <CoursesTabs />
      {/* Gallery Preview */}
        <GalleryPreview />
        <ContactSection />
      {/* Footer */}
      <Footer />
      <Toaster />
    </main>
  );
}
