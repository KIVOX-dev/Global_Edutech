'use client'

import { useState, FormEvent } from 'react'
import FancySelect from './FancySelect'
import { MapPin, Monitor } from 'lucide-react'

interface EnquiryFormProps {
  courseTitle?: string
  compact?: boolean // single column, for narrow sidebars
}

const PROGRAMS = [
  ['General Enquiry', 'General Enquiry'],
  ['Pre-School', 'Pre-School Program'],
  ['After-School', 'After-School Program'],
  ['Home Tuition', 'Home Tuition'],
  ['Summer Camp', 'Summer Camp'],
  ['Skill Development', 'Skill Development'],
]

const field = 'h-12 lg:h-11 w-full rounded-xl border-2 border-purple/20 bg-white px-4 text-base text-foreground placeholder:text-foreground/40 transition focus:border-purple focus:outline-none focus:ring-4 focus:ring-purple/15'

export default function EnquiryForm({ courseTitle, compact = false }: EnquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: courseTitle || '',
    studentAge: '',
    preferredTime: '',
    mode: '',
    message: courseTitle ? `I'm interested in the ${courseTitle} program.` : '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }
  
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      // Determine form type based on program selection
      const formType = formData.program === 'General Enquiry' ? 'General Enquiry' : 'Program Enquiry';
      
      // Prepare form data for submission
      const dataToSubmit = {
        ...formData,
        formType
      }
      
      // Submit form data to API
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Error submitting form')
      }
      
      setIsSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        program: '',
        studentAge: '',
        preferredTime: '',
        mode: '',
        message: '',
      })
    } catch (err: any) {
      setError(err.message || 'There was an error submitting your enquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Thank You!</h3>
        <p className="text-gray-600">
          Your enquiry has been received. Our team will contact you shortly.
        </p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="mt-4 font-medium text-purple hover:underline"
        >
          Submit another enquiry
        </button>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Two-column layout */}
      <div className={`grid grid-cols-1 gap-x-5 gap-y-4 lg:gap-y-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        {/* Row 1: Name and Email */}
        <div>
          <label htmlFor="enquiry-name" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Your Name *
          </label>
          <input
            type="text"
            id="enquiry-name"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={field}
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label htmlFor="enquiry-email" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Email Address *
          </label>
          <input
            type="email"
            id="enquiry-email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            enterKeyHint="next"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={field}
            placeholder="john.doe@example.com"
          />
        </div>
        
        {/* Row 2: Phone and Program */}
        <div>
          <label htmlFor="enquiry-phone" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Phone Number *
          </label>
          <input
            type="tel"
            id="enquiry-phone"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className={field}
            placeholder="+91 93630 42019"
          />
        </div>
        
        <div>
          <label htmlFor="program" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Program of Interest *
          </label>
          <FancySelect
            id="program"
            value={formData.program}
            onChange={(v) => setFormData((prev) => ({ ...prev, program: v }))}
            required
            className={field}
            placeholder="Select a program"
            options={[
              ...(courseTitle && !PROGRAMS.some(([v]) => v === courseTitle) ? [{ value: courseTitle, label: courseTitle }] : []),
              ...PROGRAMS.map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
        </div>
        
        {/* Row 3: Student Age and Preferred Time */}
        <div>
          <label htmlFor="studentAge" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Student's Age Range
          </label>
          <FancySelect
            id="studentAge"
            value={formData.studentAge}
            onChange={(v) => setFormData((prev) => ({ ...prev, studentAge: v }))}
            className={field}
            placeholder="Select age range"
            options={['3-5 years', '6-8 years', '9-12 years', '13-15 years', '16-18 years', 'Adult'].map((v) => ({ value: v, label: v }))}
          />
        </div>
        
        <div>
          <label htmlFor="preferredTime" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Preferred Time for Contact
          </label>
          <FancySelect
            id="preferredTime"
            value={formData.preferredTime}
            onChange={(v) => setFormData((prev) => ({ ...prev, preferredTime: v }))}
            className={field}
            placeholder="Select preferred time"
            options={['Morning (9am - 12pm)', 'Afternoon (12pm - 3pm)', 'Evening (3pm - 6pm)'].map((v) => ({ value: v, label: v }))}
          />
        </div>
        
        {/* Class mode */}
        <div className={compact ? '' : 'md:col-span-2'}>
          <span id="mode-label" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">Class Mode</span>
          <div role="radiogroup" aria-labelledby="mode-label" className="grid grid-cols-2 gap-3">
            {(['Online', 'Offline'] as const).map((m) => {
              const on = formData.mode === m
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setFormData((prev) => ({ ...prev, mode: on ? '' : m }))}
                  className={`flex h-12 lg:h-11 items-center justify-center gap-2 rounded-xl border-2 text-base font-semibold transition-all duration-200 ${on ? 'border-purple bg-purple text-white shadow-md' : 'border-purple/20 bg-white text-foreground/80 hover:border-purple/50 hover:bg-purpleLight'}`}
                >
                  {m === 'Online' ? <Monitor className="h-5 w-5" /> : <MapPin className="h-5 w-5" />} {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 4: Message - full width */}
        <div className={compact ? '' : 'md:col-span-2'}>
          <label htmlFor="enquiry-message" className="mb-1.5 lg:mb-1 block text-sm font-semibold text-purple">
            Message *
          </label>
          <textarea
            id="enquiry-message"
            name="message"
            rows={2}
            required
            value={formData.message}
            onChange={handleChange}
            className={`${field} h-auto min-h-24 py-3 lg:min-h-[4.5rem] lg:py-2`}
            placeholder="I'd like to know more about..."
          ></textarea>
        </div>
      </div>
      
      {/* Submit button - centered */}
      <div className={`mt-6 lg:mt-4 max-lg:sticky max-lg:bottom-0 max-lg:z-20 max-lg:-mx-5 max-lg:border-t max-lg:bg-white/95 max-lg:px-5 max-lg:py-3 max-lg:backdrop-blur sm:max-lg:-mx-8 sm:max-lg:px-8 ${compact ? '' : 'flex justify-center'}`}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 lg:h-11 w-full items-center justify-center rounded-xl bg-purple px-8 text-base font-bold text-white shadow-lg transition hover:bg-purple/90 disabled:opacity-60 sm:w-auto sm:min-w-56"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
        </button>
      </div>
      <p className="mt-4 lg:mt-3 text-center text-xs text-foreground/60">
        By submitting this form you agree to our <a href="/privacy-policy" className="font-semibold text-purple underline">Privacy Policy</a> and <a href="/terms-of-service" className="font-semibold text-purple underline">Terms of Service</a>, and to being contacted about your enquiry.
      </p>
    </form>
  )
}
