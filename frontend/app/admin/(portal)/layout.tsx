'use client'

import { BarChart3, BookOpen, CalendarCheck, CalendarOff, ClipboardList, CreditCard, FileText, Bell, GraduationCap, LayoutDashboard, Receipt, Settings, UserCog } from 'lucide-react'
import AppShell, { NavItem } from '@/components/portal/AppShell'

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', primary: true, short: 'Home', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', primary: true, icon: GraduationCap },
  { href: '/admin/staff', label: 'Staff', icon: UserCog },
  { href: '/admin/courses', label: 'Courses & Batches', icon: BookOpen },
  { href: '/admin/attendance', label: 'Attendance', primary: true, icon: CalendarCheck },
  { href: '/admin/leaves', label: 'Leaves', icon: CalendarOff },
  { href: '/admin/fees', label: 'Fees', primary: true, icon: CreditCard },
  { href: '/admin/payments', label: 'Payments', icon: Receipt },
  { href: '/admin/reminders', label: 'Reminders', icon: Bell },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/holidays', label: 'Holidays', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText },
]

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="ADMIN" nav={NAV}>{children}</AppShell>
}

