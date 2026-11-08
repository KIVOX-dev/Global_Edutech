'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EnquiryForm from './EnquiryForm'

function Inner() {
  const course = useSearchParams().get('course')?.slice(0, 80) || undefined
  return (
    <>
      {course && <p className="mb-5 rounded-xl bg-[#FFD93D] px-4 py-3 text-center text-sm font-medium text-[#3b1d7a] shadow-sm">Enquiring about: <strong>{course}</strong></p>}
      <EnquiryForm courseTitle={course} />
    </>
  )
}

// The enquiry page can be opened from a course page with ?course=<name> to pre-select the program
export default function EnquiryFromQuery() {
  return <Suspense fallback={<div className="h-40" />}><Inner /></Suspense>
}
