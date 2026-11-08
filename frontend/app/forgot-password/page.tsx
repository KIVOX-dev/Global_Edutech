'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import AuthFrame from '@/components/portal/AuthFrame'
import { btn, inputCls } from '@/components/portal/kit'
import { api, errorMessage } from '@/lib/portal/api'

function Form() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim() })
      setMsg(data.message)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (msg) return <div className="space-y-4"><p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">{msg}</p><Link href="/login" className={`${btn('outline')} w-full`}>Back to sign in</Link></div>
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Email
        <input className={`${inputCls} mt-1`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className={`${btn('primary', 'lg')} w-full`} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link</button>
      <p className="text-center text-sm"><Link href="/login" className="text-purple hover:underline">Back to sign in</Link></p>
    </form>
  )
}

export default function ForgotPasswordPage() {
  return <AuthFrame title="Forgot password" subtitle="We will email you a link that is valid for one hour."><Form /></AuthFrame>
}
