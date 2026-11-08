import { Metadata } from 'next'
import { getCategories, getCoursesByCategory } from '@/data/courses'
import CourseCard from '@/components/courses/CourseCard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Our Courses | Global EduTech',
  description: 'Browse our comprehensive range of educational programs for children and educators.',
}

export default function CoursesPage() {
  const categories = getCategories()
  
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />
      
      <div className=" pb-16 bg-white">
        <section className="bg-purpleLight py-16">
          <div className="container-custom">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary mb-6 text-center">
              Our Educational Programs
            </h1>
            <p className="text-lg md:text-xl text-black max-w-3xl mx-auto text-center leading-relaxed">
              Browse our comprehensive selection of programs designed to nurture young minds and 
              provide educators with the skills they need to excel.
            </p>
          </div>
        </section>
      
        {categories.map((category, index) => {
          const courses = getCoursesByCategory(category.id as 'academic' | 'skill' | 'teacher')
          const isEven = index % 2 === 0;
          
          return (
            <section 
              key={category.id} 
              id={category.id}
              className={`py-16 ${isEven ? 'bg-white' : 'bg-grayLight'}`}
            >
              <div className="container-custom">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-8">
                  {category.name}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map(course => (
                    <CourseCard key={course.slug} course={course} />
                  ))}
                </div>
              </div>
            </section>
          )
        })}
      </div>
      
      {/* Footer */}
      <section className="bg-purpleLight py-16">
        <div className="container-custom">
          <Footer />
        </div>
      </section>
    </main>
  )
}
