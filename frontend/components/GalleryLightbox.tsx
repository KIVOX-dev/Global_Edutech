'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { GalleryImage } from '@/data/gallery'

type Props = {
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
}

export default function GalleryLightbox({ images, initialIndex, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const currentImage = images[currentIndex]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = 'auto'
    }
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-foreground p-2 rounded-full bg-background/40">
        ✕
      </button>

      <button onClick={() => setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground p-2 rounded-full bg-background/40">
        ‹
      </button>

      <div className="max-w-4xl max-h-[80vh] w-full">
        <div className="relative w-full h-full flex items-center justify-center">
          <Image src={currentImage.src} alt={currentImage.alt} width={currentImage.width} height={currentImage.height} className="object-contain max-h-[80vh] mx-auto" />
        </div>
        <div className="mt-2 text-center text-foreground">
          <div className="font-medium">{currentImage.alt}</div>
          <div className="text-sm text-gray-300">{currentIndex + 1} of {images.length}</div>
        </div>
      </div>

      <button onClick={() => setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0))} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground p-2 rounded-full bg-background/40">
        ›
      </button>
    </div>
  )
}
