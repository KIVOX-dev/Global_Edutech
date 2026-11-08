'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, homeFor, useAuth } from '@/lib/portal/auth'
import { Spinner, cx } from './kit'

export type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; external?: boolean }

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
              className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive(n.href) ? 'bg-white text-purple shadow' : 'text-white/85 hover:bg-white/15')}
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
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-gradient-to-b from-purple to-purple/85">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-muted" aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <span className="font-display font-bold text-purple">Global Edutech</span>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}

export default function AppShell(props: { role: 'ADMIN' | 'STAFF'; nav: NavItem[]; children: React.ReactNode }) {
  return <AuthProvider><Shell {...props} /></AuthProvider>
}
