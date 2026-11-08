'use client'

import { CalendarCheck, CalendarDays, CalendarOff, ClipboardCheck, LayoutDashboard, UserCircle } from 'lucide-react'
import AppShell, { NavItem } from '@/components/portal/AppShell'

const NAV: NavItem[] = [
  { href: '/staff', label: 'Dashboard', primary: true, short: 'Home', icon: LayoutDashboard },
  { href: '/staff/batches', label: 'My Batches', icon: CalendarDays },
  { href: '/staff/mark', label: 'Mark Attendance', primary: true, short: 'Mark', icon: ClipboardCheck },
  { href: '/staff/attendance', label: 'My Attendance', primary: true, short: 'Attend', icon: CalendarCheck },
  { href: '/staff/leaves', label: 'Leaves', primary: true, icon: CalendarOff },
  { href: '/staff/profile', label: 'Profile', icon: UserCircle },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="STAFF" nav={NAV}>{children}</AppShell>
}
