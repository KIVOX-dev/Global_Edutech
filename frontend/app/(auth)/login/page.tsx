'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AuthFrame from '@/components/portal/AuthFrame'
import GoogleSignIn from '@/components/portal/GoogleSignIn'
import { btn, inputCls } from '@/components/portal/kit'
import { homeFor, useAuth } from '@/lib/portal/auth'
import { errorMessage } from '@/lib/portal/api'

function LoginForm() {
  const { user, loading, login, googleLogin } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(params.get('expired') ? 'Your session expired. Please sign in again.' : null)

  // Already signed in: go straight to the right area
  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user))
  }, [user, loading, router])

  const goHome = (u: Awaited<ReturnType<typeof login>>) => {
    const next = params.get('next')
    const allowed = next && next.startsWith(u.role === 'ADMIN' ? '/admin' : '/staff')
    router.replace(u.mustChangePassword ? '/change-password' : allowed ? next! : homeFor(u))
  }

  const onGoogle = async (credential: string) => {
    setBusy(true)
    setError(null)
    try {
      goHome(await googleLogin(credential))
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      goHome(await login(email.trim(), password))
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 sm:space-y-4">
      <label className="block text-sm font-medium">Email
        <input className={`${inputCls} mt-1`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Password
        <input className={`${inputCls} mt-1`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className={`${btn('primary', 'lg')} w-full`} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
      <p className="text-center text-sm"><Link href="/forgot-password" className="text-purple hover:underline">Forgot password?</Link></p>
      <GoogleSignIn onCredential={onGoogle} disabled={busy} />
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to the admin panel or staff portal.">
      <LoginForm />
    </AuthFrame>
  )
}
