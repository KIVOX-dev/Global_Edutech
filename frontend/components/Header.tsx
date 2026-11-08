'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
// import { ThemeToggle } from './theme-toggle'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  const navLinks = [
    { href: '/#home', label: 'Home' },
    { href: '/#why-choose-us', label: 'Why Us' },
    { href: '/#services', label: 'Services' },
    { href: '/courses', label: 'Courses' },
    { href: '/#gallery', label: 'Gallery' },
    { href: '/#contact', label: 'Contact' },
  ]

  return (
    <header className="bg-background/95 backdrop-blur shadow-sm sticky top-0 z-50 transition-shadow">
      <div className="container-custom">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-md">
              <img src="/images/logo.png" alt="Global Edutech Logo" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
                Global Edutech
              </h1>
              <p className="text-xs text-foreground font-poppins">Nurturing Young Minds</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={e => {
                  if (link.href.includes('#')) {
                    handleNavClick(e, link.href.split('#')[1])
                  }
                }} 
                className={`font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground hover:text-primary`}
                aria-label={link.label}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Login to the staff and admin portal"
            >
              Login
            </Link>
            {/* <ThemeToggle /> */}
            <Button
              variant="enquireNow"
              className="w-auto px-6 py-2"
              onClick={e => handleNavClick(e, 'contact')}
              aria-label="Enquire Now"
            >
              <span className="inline-flex items-center gap-2">
                <span role="img" aria-label="Star">✨</span> Enquire Now
              </span>
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-grayLight focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`w-full h-0.5 bg-foreground transition-all ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`w-full h-0.5 bg-foreground my-1 transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-full h-0.5 bg-foreground transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </div>
          </button>

          {/* Mobile Navigation Drawer */}
          {isMenuOpen && (
            <nav className="absolute top-full left-0 w-full bg-background shadow-lg rounded-b-xl py-4 px-6 flex flex-col space-y-4 md:hidden animate-fadeInUp z-40">
              {navLinks.map(link => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={e => {
                    if (link.href.includes('#')) {
                      handleNavClick(e, link.href.split('#')[1])
                    }
                    setIsMenuOpen(false)
                  }} 
                  className={`font-medium transition-colors text-foreground hover:text-primary`}
                  aria-label={link.label}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="font-medium text-primary hover:underline"
                aria-label="Login to the staff and admin portal"
              >
                Login
              </Link>
              <Button
                variant="enquireNow"
                className="text-left"
                onClick={e => {
                  handleNavClick(e, 'contact')
                  setIsMenuOpen(false)
                }}
                aria-label="Enquire Now"
              >
                <span className="inline-flex items-center gap-2">
                  <span role="img" aria-label="Star">✨</span> Enquire Now
                </span>
              </Button>
              {/* <div className="flex justify-center py-2">
                <ThemeToggle />
              </div> */}
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}

