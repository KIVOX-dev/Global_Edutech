'use client'

import { useState } from 'react'
import { Check, Star } from 'lucide-react'

export default function TestimonialsSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const testimonials = [
    {
      name: "Mrs. Kausalya",
      role: "Mother of 5-year-old Jikthisha",
      service: "Preschool Program",
      rating: 5,
      
      testimonial: "The school has been very accommodating for us. Even on the days when we arrived late, the teachers took such good care of Jikthisha without any complaints. That support really put us at ease as parents. We are happy that our child is in such a caring environment.",
      results: "Excellent care and accommodation"
    },
    {
      name: "Mrs. Kalai",
      role: "Mother of Shreya",
      service: "Day Care",
      rating: 5,
      
      testimonial: "I am really glad we chose this day care for Shreya. She has adjusted so well here, and the teachers treat her with so much love and patience. As a working parent, I feel completely stress-free knowing she is safe, happy, and learning every day.",
      results: "Excellent adjustment and daily learning"
    },
    {
      name: "Mrs. Nandini",
      role: "Mother of Ari Braxton",
      service: "Early Education",
      rating: 5,
      
      testimonial: "I see a lot of improvement in Ari ever since he started here. He has started trying to speak in English, which makes us very proud. His confidence is growing day by day, and we are thankful to the teachers for encouraging him in every small step.",
      results: "Improved confidence and language skills"
    },
    {
      name: "Zapp Studios",
      role: "Parent of Duruvan",
      service: "Regular Program",
      rating: 5,
      
      testimonial: "Duruvan absolutely loves coming to the campus every day. The teachers are so friendly, and the way they handle the children makes learning fun. The different activities provided here keep him engaged, and as parents, we are delighted to see him enjoy and learn at the same time.",
      results: "Engaged learning and enjoyment"
    },
    {
      name: "Mr. Satish",
      role: "Father of Adhira",
      service: "Creative Program",
      rating: 5,
      
      testimonial: "The Friday activities are the highlight for Adhira. Every week, she looks forward to going to school on Fridays because of the fun and creative sessions planned. It's wonderful to see how much the kids enjoy and learn through these special activities.",
      results: "Enhanced creativity and engagement"
    },
    {
      name: "Mrs. Fatima",
      role: "Mother of Nisha",
      service: "ABACUS Program",
      rating: 5,
      
      testimonial: "My child struggled with math, so we enrolled him in the ABACUS program. After joining, we have seen not just a small change but a major overall improvement. We are truly overwhelmed by his progress and thankful for the efforts of the teachers.",
      results: "Major improvement in mathematics"
    },
    {
      name: "Mrs. Mary",
      role: "Parent of Isabella",
      service: "Phonics Classes",
      rating: 5,
      
      testimonial: "We enrolled our child to the phonics classes during the summer just to keep him engaged. Without us realizing, he went on to qualify till the Spellbee state level without any extra teaching. This was only because of the strong foundation built in phonics classes. We are amazed at this growth.",
      results: "Qualified for Spellbee state level"
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <section id="testimonials" className="section-padding section-surface">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary mb-6">
            What Parents Say About Us
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what real parents have to say about 
            their children's transformation with Global Edutech.
          </p>
        </div>

        {/* Testimonials Slider */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-card rounded-3xl p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Avatar and Info */}
              <div className="text-center lg:text-left flex-shrink-0">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-hero-gradient font-display text-2xl font-bold text-white lg:mx-0">{testimonials[currentSlide].name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</div>
                <h4 className="text-xl font-bold text-primary mb-1">
                  {testimonials[currentSlide].name}
                </h4>
                <p className="text-muted-foreground mb-2">{testimonials[currentSlide].role}</p>
                <div className="flex justify-center lg:justify-start items-center gap-1">
                  {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow text-yellow" />
                  ))}
                </div>
              </div>

              {/* Testimonial Content */}
              <div className="relative">
                <span className="absolute -top-4 -left-4 text-7xl text-muted-foreground/20">“</span>
                <p className="text-lg text-foreground/80 leading-relaxed mb-4">
                  {testimonials[currentSlide].testimonial}
                </p>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="font-bold text-purple">
                    <Check className="mr-2 inline h-5 w-5 text-accent" strokeWidth={3} />
                    {testimonials[currentSlide].results}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Controls */}
          <button 
            onClick={prevSlide} 
            className="absolute top-1/2 -left-4 lg:-left-16 transform -translate-y-1/2 bg-background/50 hover:bg-background text-primary rounded-full w-12 h-12 flex items-center justify-center shadow-md transition"
            aria-label="Previous testimonial"
          >
            &lt;
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute top-1/2 -right-4 lg:-right-16 transform -translate-y-1/2 bg-background/50 hover:bg-background text-primary rounded-full w-12 h-12 flex items-center justify-center shadow-md transition"
            aria-label="Next testimonial"
          >
            &gt;
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                currentSlide === index
                  ? 'bg-primary border-primary shadow-md'
                  : 'bg-muted border-foreground/20'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
