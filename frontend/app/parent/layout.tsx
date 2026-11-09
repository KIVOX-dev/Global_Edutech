'use client'

import { CalendarCheck, CreditCard, LayoutDashboard } from 'lucide-react'
import AppShell, { NavItem } from '@/components/portal/AppShell'
import { ChildProvider } from '@/components/portal/ParentChild'

const NAV: NavItem[] = [
  { href: '/parent', label: 'Overview', primary: true, short: 'Home', icon: LayoutDashboard },
  { href: '/parent/attendance', label: 'Attendance', primary: true, icon: CalendarCheck },
  { href: '/parent/fees', label: 'Fees', primary: true, icon: CreditCard },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="PARENT" nav={NAV}><ChildProvider>{children}</ChildProvider></AppShell>
}
