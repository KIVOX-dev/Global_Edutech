import ChatWidget from '@/components/shared/ChatWidget'
import CookieBanner from '@/components/shared/CookieBanner'

// Public website pages: adds the floating assistant on every page
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
      <CookieBanner />
    </>
  )
}
