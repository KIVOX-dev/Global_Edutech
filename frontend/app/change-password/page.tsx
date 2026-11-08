'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AuthFrame from '@/components/portal/AuthFrame'
import { btn, inputCls } from '@/components/portal/kit'
import { api, errorMessage } from '@/lib/portal/api'
import { homeFor, useAuth } from '@/lib/portal/auth'

function Form() {
  const { user, loading, refresh } = useAuth()
  const router = useRouter()
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (!loading && !user) router.replace('/login') }, [loading, user, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== pw2) return setError('Passwords do not match')
    setBusy(true)
    setError(null)
    try {
      await api.post('/auth/change-password', { currentPassword: cur, newPassword: pw })
      await refresh()
      router.replace(user ? homeFor({ ...user, mustChangePassword: false }) : '/login')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Current (temporary) password
        <input className={`${inputCls} mt-1`} type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">New password
        <input className={`${inputCls} mt-1`} type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        <span className="text-xs text-muted-foreground">At least 8 characters with letters and numbers.</span>
      </label>
      <label className="block text-sm font-medium">Confirm new password
        <input className={`${inputCls} mt-1`} type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className={`${btn('primary', 'lg')} w-full`} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
    </form>
  )
}

export default function ChangePasswordPage() {
  return <AuthFrame title="Change your password" subtitle="Choose a new password to continue."><Form /></AuthFrame>
}
