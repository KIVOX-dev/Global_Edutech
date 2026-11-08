'use client'

import { BarChart3, BookOpen, CalendarCheck, CalendarOff, ClipboardList, CreditCard, FileText, Bell, GraduationCap, LayoutDashboard, Mail, Receipt, Settings, UserCog } from 'lucide-react'
import AppShell, { NavItem } from '@/components/portal/AppShell'

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/admin/staff', label: 'Staff', icon: UserCog },
  { href: '/admin/courses', label: 'Courses & Batches', icon: BookOpen },
  { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/admin/leaves', label: 'Leaves', icon: CalendarOff },
  { href: '/admin/fees', label: 'Fees', icon: CreditCard },
  { href: '/admin/payments', label: 'Payments', icon: Receipt },
  { href: '/admin/reminders', label: 'Reminders', icon: Bell },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/holidays', label: 'Holidays', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText },
  { href: '/admin/dashboard', label: 'Website Enquiries', icon: Mail },
]

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="ADMIN" nav={NAV}>{children}</AppShell>
}

