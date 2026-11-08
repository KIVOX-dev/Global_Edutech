import Link from 'next/link'

export default function CourseNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-500 mb-6">
          Course Not Found
        </h1>
        <p className="text-lg text-text mb-8">
          We couldn't find the course you're looking for. It may have been moved or doesn't exist.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/courses" className="px-6 py-3 bg-primary-500 text-white font-medium rounded-md hover:bg-primary-600 transition-colors duration-300">
            Browse All Courses
          </Link>
          <Link href="/" className="px-6 py-3 border border-primary-500 text-primary-500 font-medium rounded-md hover:bg-primary-50 transition-colors duration-300">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
