'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, homeFor, useAuth } from '@/lib/portal/auth'
import { Spinner, cx } from './kit'

export type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; primary?: boolean; short?: string }

function Shell({ role, nav, children }: { role: 'ADMIN' | 'STAFF'; nav: NavItem[]; children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (user.mustChangePassword) router.replace('/change-password')
    else if (user.role !== role) router.replace(homeFor(user))
  }, [user, loading, role, router, pathname])

  useEffect(() => setOpen(false), [pathname])

  if (loading || !user || user.role !== role || user.mustChangePassword) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  const isActive = (href: string) => (href === `/${role.toLowerCase()}` ? pathname === href : pathname.startsWith(href))
  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className="flex items-center gap-3 px-4 py-5">
        <img src="/images/logo.png" alt="" className="h-9 w-9 rounded-lg bg-white p-1" />
        <div>
          <p className="font-display text-base font-bold leading-tight text-white">Global Edutech</p>
          <p className="text-[11px] uppercase tracking-wider text-white/70">{role === 'ADMIN' ? 'Admin panel' : 'Staff portal'}</p>
        </div>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((n) => (
          <li key={n.href}>
            <Link
              href={n.href}
              className={cx('flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive(n.href) ? 'bg-white text-purple shadow' : 'text-white/85 hover:bg-white/15')}
              aria-current={isActive(n.href) ? 'page' : undefined}
            >
              <n.icon className="h-4 w-4 shrink-0" />{n.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/20 p-3">
        <p className="truncate px-2 text-sm font-medium text-white">{user.name}</p>
        <p className="truncate px-2 pb-2 text-xs text-white/70">{user.email}</p>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/90 hover:bg-white/15"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-gradient-to-b from-purple to-purple/85 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-gradient-to-b from-purple to-purple/85 pb-[env(safe-area-inset-bottom)]"><button onClick={() => setOpen(false)} className="absolute right-2 top-3 z-10 rounded-lg p-2 text-white hover:bg-white/15" aria-label="Close menu"><X className="h-5 w-5" /></button>{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <img src="/images/logo.png" alt="" className="h-8 w-8" />
          <span className="flex-1 truncate font-display font-bold text-purple">{role === 'ADMIN' ? 'Admin' : 'Staff'} · {user.name.split(' ')[0]}</span>
          <button onClick={logout} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
        </header>
        <main className="mx-auto w-full max-w-7xl p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar: the four main screens plus a menu with everything else */}
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {nav.filter((n) => n.primary).slice(0, 4).map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}
                className={cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium active:bg-muted', isActive(n.href) ? 'text-purple' : 'text-muted-foreground')}>
                <n.icon className="h-5 w-5" />
                <span className="max-w-full truncate px-1">{n.short || n.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button onClick={() => setOpen(true)} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground active:bg-muted" aria-label="Open full menu">
              <Menu className="h-5 w-5" /><span>More</span>
            </button>
          </li>
        </ul>
      </nav>
      <Toaster />
    </div>
  )
}

export default function AppShell(props: { role: 'ADMIN' | 'STAFF'; nav: NavItem[]; children: React.ReactNode }) {
  return <AuthProvider><Shell {...props} /></AuthProvider>
}
