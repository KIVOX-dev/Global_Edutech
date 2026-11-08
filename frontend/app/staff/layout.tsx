'use client'

import { CalendarCheck, CalendarDays, CalendarOff, ClipboardCheck, LayoutDashboard, UserCircle } from 'lucide-react'
import AppShell, { NavItem } from '@/components/portal/AppShell'

const NAV: NavItem[] = [
  { href: '/staff', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/batches', label: 'My Batches', icon: CalendarDays },
  { href: '/staff/mark', label: 'Mark Attendance', icon: ClipboardCheck },
  { href: '/staff/attendance', label: 'My Attendance', icon: CalendarCheck },
  { href: '/staff/leaves', label: 'Leaves', icon: CalendarOff },
  { href: '/staff/profile', label: 'Profile', icon: UserCircle },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="STAFF" nav={NAV}>{children}</AppShell>
}
