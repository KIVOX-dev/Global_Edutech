'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/portal/auth'
import { Spinner } from './kit'

// Centered card used by login / forgot / reset / change-password
export default function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purpleLight via-background to-pastel-blue/20 p-4">
        <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl sm:p-8">
          <Link href="/" className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple/10"><img src="/images/logo.png" alt="" className="h-8 w-8" /></span>
            <span className="font-display text-xl font-bold text-purple">Global Edutech</span>
          </Link>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">
            <Suspense fallback={<div className="flex justify-center py-6"><Spinner /></div>}>{children}</Suspense>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground"><Link href="/" className="hover:underline">← Back to website</Link></p>
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  )
}
