import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { galleryImages } from '@/data/gallery'
import Gallery from '@/components/Gallery'

export const metadata = {
  title: 'Photo Gallery | Global Edutech',
  description: 'Explore our gallery of educational activities, events, and learning moments at Global Edutech.'
}

export default function GalleryPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="bg-primary-light py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Photo Gallery</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Explore images from our educational activities, events, and learning moments at Global Edutech.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Gallery images={galleryImages} />
      </div>

      <Footer />
    </main>
  )
}
