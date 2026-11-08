'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
          <Link href="/" className="mb-6 flex justify-center" aria-label="Global Edutech home">
            <img src="/images/logo-banner.png" alt="Global Edutech - Nurturing Young Minds" width={2014} height={438} className="h-16 w-auto sm:h-[4.5rem]" />
          </Link>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">
            <Suspense fallback={<div className="flex justify-center py-6"><Spinner /></div>}>{children}</Suspense>
          </div>
          <div className="mt-6 flex justify-center">
            <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-purple px-6 text-sm font-bold text-purple transition hover:bg-purple hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to website
            </Link>
          </div>
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  )
}
