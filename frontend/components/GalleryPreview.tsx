'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getFeaturedGalleryImages } from '@/data/gallery'
import GalleryThumbnail from './GalleryThumbnail'
import GalleryLightbox from './GalleryLightbox'
import { motion } from 'framer-motion'
import { Button } from './ui/button'

export default function GalleryPreview() {
  // Get random selection of 6 images
  const featured = getFeaturedGalleryImages(6)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  return (
    <section id="gallery" className="section-padding bg-pastel-yellow/20">
      <div className="container-custom">
        <div className="text-center mb-10">
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold text-primary mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Our Photo Gallery
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-700 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Take a peek at the memorable moments from our educational journey.
          </motion.p>
        </div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {featured.map((image, index) => (
            <GalleryThumbnail 
              key={image.id} 
              image={image} 
              onClick={() => setSelectedIndex(index)} 
              className="shadow-md hover:shadow-lg transition-shadow duration-300"
            />
          ))}
        </motion.div>

        <div className="text-center">
          <Button asChild variant="outline" className="bg-white shadow-sm">
            <Link href="/gallery">View Full Gallery</Link>
          </Button>
        </div>

        {/* Lightbox for preview images */}
        {selectedIndex !== null && (
          <GalleryLightbox 
            images={featured} 
            initialIndex={selectedIndex} 
            onClose={() => setSelectedIndex(null)} 
          />
        )}
      </div>
    </section>
  )
}
