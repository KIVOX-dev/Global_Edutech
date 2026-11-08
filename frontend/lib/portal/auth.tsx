'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from './api'

export type PortalUser = { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; mustChangePassword: boolean; avatarKey?: string }

type Ctx = {
  user: PortalUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<PortalUser>
  googleLogin: (credential: string) => Promise<PortalUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<Ctx | null>(null)
export const homeFor = (u: PortalUser) => (u.mustChangePassword ? '/change-password' : u.role === 'ADMIN' ? '/admin' : '/staff')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef<PortalUser | null>(null)
  userRef.current = user

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: PortalUser }>('/auth/me')
      setUser(data.user)
    } catch (e) {
      setUser(null)
      if (!(e instanceof ApiError) || e.status !== 401) console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    // Only redirect when someone who WAS signed in loses the session (never for visitors on login / forgot / reset pages)
    const onExpired = () => { if (!userRef.current) return; setUser(null); router.replace('/login?expired=1') }
    window.addEventListener('portal:session-expired', onExpired)
    return () => window.removeEventListener('portal:session-expired', onExpired)
  }, [router])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ user: PortalUser }>('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  const googleLogin = useCallback(async (credential: string) => {
    const { data } = await api.post<{ user: PortalUser }>('/auth/google', { credential })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    setUser(null)
    router.replace('/login')
  }, [router])

  const value = useMemo(() => ({ user, loading, login, googleLogin, logout, refresh }), [user, loading, login, googleLogin, logout, refresh])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
