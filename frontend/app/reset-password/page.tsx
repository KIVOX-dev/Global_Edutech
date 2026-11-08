'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AuthFrame from '@/components/portal/AuthFrame'
import { btn, inputCls } from '@/components/portal/kit'
import { api, errorMessage } from '@/lib/portal/api'

function Form() {
  const params = useSearchParams()
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = params.get('token')
  const email = params.get('email')

  if (!token || !email) return <p className="text-sm text-red-700">This reset link is incomplete. Request a new one from the <Link className="underline" href="/forgot-password">forgot password</Link> page.</p>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== pw2) return setError('Passwords do not match')
    setBusy(true)
    setError(null)
    try {
      await api.post('/auth/reset-password', { email, token, newPassword: pw })
      router.replace('/login')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">New password
        <input className={`${inputCls} mt-1`} type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        <span className="text-xs text-muted-foreground">At least 8 characters with letters and numbers.</span>
      </label>
      <label className="block text-sm font-medium">Confirm password
        <input className={`${inputCls} mt-1`} type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className={`${btn('primary', 'lg')} w-full`} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Reset password</button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return <AuthFrame title="Choose a new password"><Form /></AuthFrame>
}
