'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PublicAuthConfig, PublicCustomer } from '@/lib/auth'

type AuthContextValue = {
  user: PublicCustomer | null
  config: PublicAuthConfig
  setUser: (user: PublicCustomer | null) => void
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const fallbackConfig: PublicAuthConfig = {
  loginEnabled: true,
  registrationEnabled: true,
  requireEmailVerification: false,
  minPasswordLength: 8,
  captchaEnabled: false,
  captchaProvider: 'turnstile',
  captchaSiteKey: '',
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialUser,
  initialConfig,
}: {
  children: ReactNode
  initialUser: PublicCustomer | null
  initialConfig: PublicAuthConfig
}) {
  const [user, setUser] = useState(initialUser)
  const [config, setConfig] = useState(initialConfig || fallbackConfig)

  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setConfig(data.config)
      })
      .catch(() => {})
  }, [])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    const data = await res.json()
    setUser(data.user || null)
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, config, setUser, refresh, logout }),
    [user, config, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
