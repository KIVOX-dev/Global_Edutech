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
  manifest: '/manifest.webmanifest',
  applicationName: 'Global Edutech',
  appleWebApp: { capable: true, title: 'Global Edutech', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-167.png', sizes: '167x167', type: 'image/png' },
    ],
    shortcut: '/icons/favicon.ico',
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
