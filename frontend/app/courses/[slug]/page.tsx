import { Metadata } from 'next'
import { getCourseBySlug, courses } from '@/lib/courses-data'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EnquiryForm from '../../../components/EnquiryForm'

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
  
  const { title, intro, longDesc, imageUrl, learning, details, category } = course
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
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2">
              <div className="inline-block bg-accent/20 text-accent-700 font-medium px-4 py-2 rounded-full mb-4">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
                {title}
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                {intro}
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                {duration && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>{duration}</span>
                  </div>
                )}
                {ageGroup && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>{ageGroup}</span>
                  </div>
                )}
                {schedule && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>{schedule}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative h-80 w-full rounded-2xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 flex items-center justify-center bg-white p-4">
                  <img 
                    src={imageUrl} 
                    alt={title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Course Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-8/12">
              <h2 className="text-3xl font-bold text-primary-900 mb-6">
                About This Program
              </h2>
              <div className="prose prose-lg max-w-none">
                <p>{longDesc}</p>
              </div>
              
              <h3 className="text-2xl font-bold text-primary-900 mt-12 mb-6">
                What You Will Learn
              </h3>
              <ul className="grid md:grid-cols-2 gap-4">
                {learning.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-accent-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              
              {prerequisites && (
                <div className="mt-12 p-6 bg-primary-50 rounded-lg">
                  <h3 className="text-xl font-bold text-primary-900 mb-4">
                    Prerequisites
                  </h3>
                  <p>{prerequisites}</p>
                </div>
              )}
            </div>
            
            <div className="w-full lg:w-4/12">
              <div id="enquiry-form" className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-primary-900 mb-6">
                  Interested in this program?
                </h3>
                <EnquiryForm courseTitle={title} />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="bg-primary-500 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Enroll?
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Join our community of learners today and embark on a journey of growth and discovery.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="px-8 py-3 bg-white text-primary-500 font-semibold rounded-md hover:bg-primary-50 transition-colors duration-300">
              Contact Us
            </Link>
            <a href="#enquiry-form" className="px-8 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-primary-500 transition-colors duration-300">
              Request Information
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
