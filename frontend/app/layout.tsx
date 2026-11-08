import './globals.css'
import { Inter, Poppins } from 'next/font/google'
import { ThemeProvider } from '@/components/theme/theme-provider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#763dcb' }

export const metadata = {
  title: 'Global Edutech - One Destination for Preschool, After-School Programs & Home Tuitions',
  description: 'Global Edutech nurtures young minds through a blend of traditional and tech-powered education — from playschool to personalized tutoring at your doorstep.',
  keywords: 'preschool, after-school programs, home tuition, education, kids learning, Montessori, Vedic Maths, phonics',
  icons: {
    icon: '/images/globaleducation.png',
    apple: '/images/globaleducation.png',
    shortcut: '/images/globaleducation.png',
  },
  openGraph: {
    title: 'Global Edutech - Quality Education for Every Child',
    description: 'Safe preschool, skill-based after-school programs, and verified home tutors. Affordable & flexible learning options.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Edutech - Quality Education for Every Child',
    description: 'Safe preschool, skill-based after-school programs, and verified home tutors.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
