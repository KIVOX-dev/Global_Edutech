'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ServicesSection() {

  const [, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement, MouseEvent>, sectionId: string) => {
    if (pathname !== '/') {
      // If we are not on the homepage, navigate to it with the hash
      window.location.href = `/#${sectionId}`;
    } else {
      // If we are on the homepage, smooth scroll
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
      }
    }
  };

  const services = [
    {
      icon: "/images/globalkids.png", // Logo placeholder
      logoAlt: "Global Kids Logo",
      title: "Global Kids - Preschool Program",
      subtitle: "Ages 2-6 Years",
      description: "A nurturing environment where young minds discover the joy of learning through play-based activities, storytelling, and hands-on exploration.",
      features: [
        "Safe and engaging environment",
        "Play-based learning methodology",
        "Montessori + Activity-based learning",
        "Social & emotional development",
        "Creative arts & crafts",
        "Early literacy & numeracy",
        "Outdoor activities & games"
      ],
      price: "Enquire Now",
      highlight: "Most Popular",
      logoPlaceholder: (
        <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
          <span className="text-xs text-gray-400">Global Kids Logo</span>
        </div>
      )
    },
    {
      icon: "/images/globaleducation.png", // Added logo for Global Education
      logoAlt: "After-School Logo",
      title: "Global Education – After School Program",
      subtitle: "Ages 5-12 Years",
      description: "Comprehensive support for school-going children with homework assistance, skill development, and enrichment activities.",
      features: [
        "Homework help & guidance",
        "Subject-specific tutoring",
        "Vedic Maths | Phonics | Tuition (All Subjects)",
        "Weekday & Weekend Batches (Evening)",
        "STEM workshops",
        "Language development",
        "Test preparation support"
      ],
      price: "Enquire Now",
      highlight: null,
      logoPlaceholder: (
        <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
          <span className="text-xs text-gray-400">After-School Logo</span>
        </div>
      )
    },
    {
      icon: "/images/tuitionpoint.png", // Added logo for Tuition Point
      logoAlt: "Tuition Points Logo",
      title: "Tuition Point - Home Tuitions",
      subtitle: "Class 1-10",
      description: "One-on-one personalized tutoring in the comfort of your home, tailored to your child's specific learning needs and goals.",
      features: [
        "Personalized curriculum",
        "Flexible scheduling",
        "Weekly Plans",
        "Progress tracking",
        "Parent-teacher collaboration",
        "Regular assessments"
      ],
      price: "Enquire Now",
      highlight: null,
      logoPlaceholder: (
        <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
          <span className="text-xs text-gray-400">Tuition Points Logo</span>
        </div>
      )
    }
  ];

  return (
    <section id="services" className="section-padding section-surface">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary mb-6">
            Our Educational Services
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Choose from our range of carefully designed programs that cater to different 
            learning needs and age groups, all delivered with excellence and care.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className={`relative bg-card rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 flex flex-col h-full ${
                service.highlight ? 'ring-2 ring-accent' : ''
              }`}
            >
              {service.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {service.highlight}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                {service.icon ? (
                  <img 
                    src={service.icon} 
                    alt={service.logoAlt || 'Service logo'} 
                    className="w-20 h-20 mx-auto mb-2 object-contain"
                  />
                ) : (
                  service.logoPlaceholder
                )}
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {service.title}
                </h3>
                <p className="text-purple font-medium">{service.subtitle}</p>
              </div>

              <p className="text-foreground/70 mb-6 leading-relaxed">
                {service.description}
              </p>

              <div className="mb-6">
                <h4 className="font-semibold text-primary mb-3">What's Included:</h4>
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-accent mr-3 mt-1">✔</span>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto text-center pt-6">
                <Button variant="enquireNow" className="w-full" onClick={e => handleNavClick(e, 'contact')} aria-label="Enquire Now">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <span role="img" aria-label="Star">✨</span> {service.price}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
