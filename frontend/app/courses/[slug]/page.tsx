import { Metadata } from 'next'
import { getCourseBySlug, courses } from '@/lib/courses-data'
import Image from 'next/image'
import { blendStyle } from '@/lib/image-blend'
import Link from 'next/link'
import LogoMarquee from '@/components/LogoMarquee'
import { Monitor } from 'lucide-react'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return courses.map(course => ({
    slug: course.slug,
  }))
}

interface CoursePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const course = getCourseBySlug(params.slug)
  
  if (!course) {
    return {
      title: 'Course Not Found | Global EduTech',
    }
  }
  
  return {
    title: `${course.title} | Global EduTech`,
    description: course.intro,
  }
}

export default function CoursePage({ params }: CoursePageProps) {
  const course = getCourseBySlug(params.slug)
  
  if (!course) {
    notFound()
  }
  
  const { title, intro, longDesc, imageUrl, learning, details, category, subTopics, subTopicsTitle } = course
  const { duration, ageGroup, schedule, prerequisites } = details
  
  // Convert category ID to display name
  const categoryLabels = {
    academic: 'Academic Program',
    skill: 'Skill Development',
    teacher: 'Teacher Training'
  }
  
  return (
    <main className="pt-24 pb-16">
      {/* Floating Navigation Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
        <Link 
          href="/courses" 
          className="flex items-center justify-center bg-primary hover:bg-accent text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          aria-label="Back to courses"
          title="Back to Courses"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
        </Link>
        
        <Link 
          href="/" 
          className="flex items-center justify-center bg-white border-2 border-primary hover:bg-primary text-primary hover:text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          aria-label="Back to home"
          title="Back to Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purpleLight to-white py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2">
              <div className="inline-block bg-purple/10 text-purple font-semibold px-4 py-2 rounded-full mb-4">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-black mb-6">
                {title}
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                {intro}
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                {duration && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>{duration}</span>
                  </div>
                )}
                {ageGroup && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>{ageGroup}</span>
                  </div>
                )}
                <div className="flex items-center rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                  <Monitor className="mr-2 h-5 w-5" />
                  <span>Available online &amp; offline</span>
                </div>
                {schedule && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>{schedule}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-white shadow-xl ring-1 ring-purple/10 md:h-80">
                <div className="absolute inset-0 flex items-center justify-center bg-white p-2">
                  <img 
                    src={imageUrl} 
                    alt={title}
                    className="h-full w-full object-contain"
                    style={blendStyle(imageUrl)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Course Content */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-8/12">
              <h2 className="mb-5 font-display text-3xl font-bold text-black">
                About This Program
              </h2>
              <div className="max-w-none text-lg leading-relaxed text-foreground/85">
                <p className="whitespace-pre-line">{longDesc}</p>
              </div>
              
              <h3 className="mb-5 mt-10 font-display text-2xl font-bold text-black">
                What You Will Learn
              </h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {learning.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow shadow-emerald-500/40">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <span className="font-medium text-foreground/90">{point}</span>
                  </li>
                ))}
              </ul>
              
              {subTopics && subTopics.length > 0 && (
                <>
                  <h3 className="mb-5 mt-10 font-display text-2xl font-bold text-black">{subTopicsTitle || 'What We Cover'}</h3>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {subTopics.map((t, i) => (
                      <li key={t.name} className={`rounded-2xl border-t-4 bg-white p-4 text-center shadow-gentle ring-1 ring-purple/10 ${['border-t-yellow', 'border-t-pink', 'border-t-purple', 'border-t-emerald-400'][i % 4]}`}>
                        <p className="font-display text-2xl font-bold text-purple">{t.name}</p>
                        <p className="mt-1 text-xs leading-snug text-foreground/70">{t.note}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {prerequisites && (
                <div className="mt-10 rounded-2xl border-l-4 border-pink bg-yellow/20 p-6">
                  <h3 className="mb-2 font-display text-xl font-bold text-black">
                    Prerequisites
                  </h3>
                  <p className="text-foreground/85">{prerequisites}</p>
                </div>
              )}
            </div>
            
            <div className="w-full lg:w-4/12">
              <div className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-purple/10">
                <h3 className="mb-2 font-display text-xl font-bold text-black">Interested in this program?</h3>
                <p className="mb-5 text-sm text-foreground/70">Send us an enquiry and we will call you back with timings, fees and a free demo.</p>
                <Link href={`/enquiry?course=${encodeURIComponent(title)}`} className="flex h-12 w-full items-center justify-center rounded-xl bg-purple text-base font-bold text-white shadow-lg transition hover:bg-purple/90">Enquire Now</Link>
              </div>
              <div className="relative lg:h-[26rem]"><LogoMarquee /></div>
            </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="hypershade py-14 text-white">
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            Ready to Enroll?
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-lg">
            Join our community of learners today and embark on a journey of growth and discovery.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/enquiry?course=${encodeURIComponent(title)}`} className="inline-flex h-12 items-center rounded-xl bg-yellow px-8 font-bold text-purple shadow-lg transition hover:scale-105">
              Enquire Now
            </Link>
            <Link href="/courses" className="inline-flex h-12 items-center rounded-xl border-2 border-white px-8 font-bold text-white transition hover:bg-white hover:text-purple">
              Browse more courses
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
