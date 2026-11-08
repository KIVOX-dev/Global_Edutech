'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/portal/auth'
import { Spinner } from './kit'
import CookieBanner from '@/components/shared/CookieBanner'

// Centered card used by login / forgot / reset / change-password
export default function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-purpleLight via-background to-pastel-blue/20 p-3 sm:p-4">
        <div className="w-full max-w-md rounded-3xl border bg-card p-4 shadow-xl sm:p-8">
          <Link href="/" className="mb-3 flex justify-center sm:mb-6" aria-label="Global Edutech home">
            <img src="/images/logo-banner.png" alt="Global Edutech - Nurturing Young Minds" width={2014} height={438} className="h-11 w-auto sm:h-[4.5rem]" />
          </Link>
          <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground sm:mt-1">{subtitle}</p>}
          <div className="mt-3 sm:mt-6">
            <Suspense fallback={<div className="flex justify-center py-6"><Spinner /></div>}>{children}</Suspense>
          </div>
          <div className="mt-3 flex justify-center sm:mt-6">
            <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl border-2 border-purple px-5 text-sm font-bold text-purple transition hover:bg-purple hover:text-white sm:h-11 sm:px-6">
              <ArrowLeft className="h-4 w-4" /> Back to website
            </Link>
          </div>
        </div>
      </div>
      <CookieBanner />
      <Toaster />
    </AuthProvider>
  )
}
