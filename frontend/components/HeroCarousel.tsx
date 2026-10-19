'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  
  const slides = [
    {
      id: 'hero',
      type: 'hero',
      image: '/images/hero-illustration.png', // Your existing hero image
      alt: 'Global Edutech - Transforming education for children'
    },
    {
      id: 'event1',
      type: 'event',
      image: '/images/specialevents/vijayadasami1.jpeg',
      alt: 'Vijayadasami Celebration',
      title: 'Vijayadasami Admissions Open',
      date: 'October 02, 2025',
      cta: 'Register Now'
    },
    {
      id: 'event2',
      type: 'event',
      image: '/images/specialevents/vijayadasami2.jpeg',
      alt: 'Vijayadasami Special Event',
      title: 'Vijayadasami Special Admissions',
      date: 'October 02, 2025',
      cta: 'Learn More'
    }
  ]
  
  useEffect(() => {
    if (!autoplay) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 2500) // Change slide every 2.5 seconds
    
    return () => clearInterval(interval)
  }, [autoplay, slides.length])
  
  const nextSlide = () => {
    setAutoplay(false) // Pause autoplay when manually navigating
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }
  
  const prevSlide = () => {
    setAutoplay(false) // Pause autoplay when manually navigating
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }
  
  const goToSlide = (index: number) => {
    setAutoplay(false) // Pause autoplay when manually navigating
    setCurrentSlide(index)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl h-full w-full">
      {/* Carousel Controls */}
      <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2">
        <button 
          onClick={prevSlide}
          className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      
      <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
        <button 
          onClick={nextSlide}
          className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Slides */}
      <div className="relative h-full w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[currentSlide].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <Image
              src={slides[currentSlide].image}
              alt={slides[currentSlide].alt}
              fill
              className={slides[currentSlide].type === 'hero' ? "object-contain" : "object-cover"}
              priority={true}
            />
            
            {/* Overlay for event slides */}
{/*             {slides[currentSlide].type === 'event' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-3 md:p-4">
                <div className="bg-yellow/90 text-black text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1 w-fit">
                  Special Event
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-white/80 text-xs md:text-sm flex items-center gap-1 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {slides[currentSlide].date}
                </p>
                <Button 
                  variant="heroEnrollNow"
                  className="w-auto text-xs md:text-sm py-1 px-3 h-auto"
                  onClick={() => window.location.href = '#contact'}
                >
                  <span role="img" aria-label="Star">✨</span> {slides[currentSlide].cta}
                </Button>
              </div>
            )} */}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Indicator dots */}
      <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-3' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}