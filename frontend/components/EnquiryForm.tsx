'use client'

import { useState, FormEvent } from 'react'

interface EnquiryFormProps {
  courseTitle?: string
}

export default function EnquiryForm({ courseTitle }: EnquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: courseTitle || '',
    studentAge: '',
    preferredTime: '',
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
          className="mt-4 text-primary font-medium hover:underline"
        >
          Submit another enquiry
        </button>
      </div>
    )
  }
  
  return (
    <form id="enquiry-form" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Row 1: Name and Email */}
        <div>
          <label htmlFor="enquiry-name" className="block text-sm font-medium text-foreground/80 mb-1">
            Your Name *
          </label>
          <input
            type="text"
            id="enquiry-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label htmlFor="enquiry-email" className="block text-sm font-medium text-foreground/80 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="enquiry-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
            placeholder="john.doe@example.com"
          />
        </div>
        
        {/* Row 2: Phone and Program */}
        <div>
          <label htmlFor="enquiry-phone" className="block text-sm font-medium text-foreground/80 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="enquiry-phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
            placeholder="+91 93630 42019"
          />
        </div>
        
        <div>
          <label htmlFor="program" className="block text-sm font-medium text-foreground/80 mb-1">
            Enquiry & Program of Interest *
          </label>
          <select
            id="program"
            name="program"
            value={formData.program}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">Select a program</option>
            <option value="General Enquiry">General Enquiry</option>
            <option value="Pre-School">Pre-School Program</option>
            <option value="After-School">After-School Program</option>
            <option value="Home Tuition">Home Tuition</option>
            <option value="Summer Camp">Summer Camp</option>
            <option value="Skill Development">Skill Development</option>
          </select>
        </div>
        
        {/* Row 3: Student Age and Preferred Time */}
        <div>
          <label htmlFor="studentAge" className="block text-sm font-medium text-foreground/80 mb-1">
            Student's Age Range *
          </label>
          <select
            id="studentAge"
            name="studentAge"
            value={formData.studentAge}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">Select age range</option>
            <option value="3-5 years">3-5 years</option>
            <option value="6-8 years">6-8 years</option>
            <option value="9-12 years">9-12 years</option>
            <option value="13-15 years">13-15 years</option>
            <option value="16-18 years">16-18 years</option>
            <option value="Adult">Adult</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="preferredTime" className="block text-sm font-medium text-foreground/80 mb-1">
            Preferred Time for Contact *
          </label>
          <select
            id="preferredTime"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">Select preferred time</option>
            <option value="Morning (9am - 12pm)">Morning (9am - 12pm)</option>
            <option value="Afternoon (12pm - 3pm)">Afternoon (12pm - 3pm)</option>
            <option value="Evening (3pm - 6pm)">Evening (3pm - 6pm)</option>
          </select>
        </div>
        
        {/* Row 4: Message - full width */}
        <div className="md:col-span-2">
          <label htmlFor="enquiry-message" className="block text-sm font-medium text-foreground/80 mb-1">
            Message *
          </label>
          <textarea
            id="enquiry-message"
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-primary focus:border-primary"
            placeholder="I'd like to know more about..."
          ></textarea>
        </div>
      </div>
      
      {/* Submit button - centered */}
      <div className="mt-6 flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground font-bold py-3 rounded-lg transition-all duration-300 disabled:bg-muted flex items-center justify-center"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
        </button>
      </div>
    </form>
  )
}
