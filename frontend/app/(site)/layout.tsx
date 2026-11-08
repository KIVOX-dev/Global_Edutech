import ChatWidget from '@/components/shared/ChatWidget'

// Public website pages: adds the floating assistant on every page
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  )
}
