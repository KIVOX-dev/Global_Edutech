'use client'

import EnquiryForm from './EnquiryForm'

export default function ContactSection() {
  return (
  <section id="contact" className="section-padding bg-muted">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary mb-6">
            Ready to Transform Your Child's Future?
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Take the first step towards giving your child the best educational foundation. 
            Contact us today for a free consultation and personalized learning plan.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Contact Forms */}
            <div className="bg-grayLight p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-6">Enquiry Form</h3>
              <EnquiryForm />
            </div>
            
            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purpleLight rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Call Us</h4>
                    <p className="text-foreground/80">+91 93630 42019</p>
                    <p className="text-sm text-muted-foreground">Mon-Sat, 9am-6pm</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-purpleLight rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Email Us</h4>
                    <p className="text-foreground/80">globaleducationgv@gmail.com</p>
                    <p className="text-sm text-muted-foreground">We respond within 2 hours</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-purpleLight rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Visit Us</h4>
                    <p className="text-foreground/80">Uppilipalayam, Coimbatore</p>
                    <p className="text-sm text-muted-foreground">Tamil Nadu, India</p>
                  </div>
                </div>
              </div>

              <div className="bg-card shadow-lg rounded-lg overflow-hidden mt-4">
                <div className="p-4 border-b flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <h3 className="text-lg font-medium">Our Location</h3>
                </div>
                <div className="h-[200px] w-full">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.4405460760117!2d77.01383229999999!3d11.0055359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba85702fc80d639%3A0x890927d41ef36398!2sGlobal%20Education%20-%20Global%20Kids%20-%20Pre%20School%20-%20Play%20School%20and%20After%20School%20Academy%20-%20Rajiv%20Gandhi%20Nagar!5e0!3m2!1sen!2sin!4v1757764743050!5m2!1sen!2sin"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Global Edutech Location - Uppilipalayam, Coimbatore"
                    aria-label="Map showing Global Edutech location in Uppilipalayam, Coimbatore, Tamil Nadu, India"
                  />
                </div>
                <div className="p-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Uppilipalayam, Coimbatore, Tamil Nadu, India
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
{/*               <div className="bg-grayLight rounded-lg p-6">
                <h4 className="font-bold text-primary mb-4">Quick Actions</h4>
                <div className="flex gap-4 justify-center">
                  <button className="w-14 h-14 bg-primary hover:bg-accent text-white font-semibold rounded-full transition-all duration-300 flex flex-col items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Schedule Demo">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="w-14 h-14 bg-primary hover:bg-accent text-white font-semibold rounded-full transition-all duration-300 flex flex-col items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Download Brochure">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button className="w-14 h-14 bg-primary hover:bg-accent text-white font-semibold rounded-full transition-all duration-300 flex flex-col items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Chat on WhatsApp">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
