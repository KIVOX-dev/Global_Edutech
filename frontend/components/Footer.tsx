'use client'
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className="bg-background text-foreground">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="section-padding border-b border-border">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img src="/images/logo.png" alt="Global Edutech Logo" className="h-10" />
                <h3 className="text-2xl font-bold">Global Edutech</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Nurturing young minds through a perfect blend of traditional teaching excellence 
                and modern educational innovations. We provide preschool programs, after-school 
                support, and personalized home tuitions.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
{/*                 <a href="https://facebook.com/globaledutech" target="_blank" rel="noopener noreferrer" className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground p-3 rounded-full transition-colors duration-300 flex items-center justify-center" aria-label="Facebook">
                  <FaFacebook className="w-6 h-6" />
                </a> */}
                <a href="https://www.instagram.com/global.education_" target="_blank" rel="noopener noreferrer" className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground p-3 rounded-full transition-colors duration-300 flex items-center justify-center" aria-label="Instagram">
                  <FaInstagram className="w-6 h-6" />
                </a>
                <a href="https://www.linkedin.com/company/global-education-after-school-activity" target="_blank" rel="noopener noreferrer" className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground p-3 rounded-full transition-colors duration-300 flex items-center justify-center" aria-label="LinkedIn">
                  <FaLinkedin className="w-6 h-6" />
                </a>
{/*                 <a href="https://x.com/globaledutech" target="_blank" rel="noopener noreferrer" className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground p-3 rounded-full transition-colors duration-300 flex items-center justify-center" aria-label="X.com">
                  <FaTwitter className="w-6 h-6" />
                </a> */}
                <a href="mailto:info@globaledutech.in" className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground p-3 rounded-full transition-colors duration-300 flex items-center justify-center" aria-label="Email">
                  <MdEmail className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold mb-6">Our Services</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#services" className="text-muted-foreground hover:text-accent transition-colors duration-300 flex items-center space-x-2">
                    <span>🎒</span>
                    <span>Preschool Program</span>
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-muted-foreground hover:text-accent transition-colors duration-300 flex items-center space-x-2">
                    <span>📘</span>
                    <span>After-School Programs</span>
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-muted-foreground hover:text-accent transition-colors duration-300 flex items-center space-x-2">
                    <span>🏡</span>
                    <span>Home Tuitions</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-muted-foreground hover:text-accent transition-colors duration-300 flex items-center space-x-2">
                    <span>📅</span>
                    <span>Free Demo Class</span>
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-muted-foreground hover:text-accent transition-colors duration-300 flex items-center space-x-2">
                    <span>⭐</span>
                    <span>Success Stories</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-accent mt-1">📍</span>
                  <div>
                    <p className="text-muted-foreground">Location:</p>
                    <p className="text-sm text-muted-foreground">69, Rajiv Gandhi Nagar, Uppilipalayam,</p>
                    <p className="text-sm text-muted-foreground">Coimbatore, Tamil Nadu 641015</p>
                  </div>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="text-accent">📞</span>
                  <div>
                    <a href="tel:+919363042019" className="text-muted-foreground hover:text-accent transition-colors duration-300">
                      +91 93630 42019
                    </a>
                    <p className="text-sm text-muted-foreground">Mon-Sat: 8 AM - 7 PM</p>
                  </div>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="text-accent">✉️</span>
                  <div>
                    <a href="mailto:globaleducationgv@gmail.com" className="text-muted-foreground hover:text-accent transition-colors duration-300">
                      globaleducationgv@gmail.com
                    </a>
                    <p className="text-sm text-muted-foreground">Replies within 2 hours</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Global Edutech. All Rights Reserved.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            <a href="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</a> | 
            <a href="/terms-of-service" className="hover:text-accent transition-colors ml-2">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
