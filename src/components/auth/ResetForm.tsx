'use client'

import { FormEvent, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import CaptchaField from '@/components/auth/CaptchaField'
import AuthFormShell from '@/components/auth/AuthFormShell'

export default function ResetForm() {
  const { config, setUser } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState(token ? '' : 'Falta el token del enlace.')
  const [loading, setLoading] = useState(false)
  const onCaptcha = useCallback((value: string) => setCaptchaToken(value), [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword, captchaToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo restablecer')
      if (data.user) setUser(data.user)
      router.push('/cuenta')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormShell title="Nueva contraseña">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder={`Nueva contraseña (mín. ${config.minPasswordLength})`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="store-input"
          autoComplete="new-password"
        />
        <input
          type="password"
          required
          placeholder="Repetir contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="store-input"
          autoComplete="new-password"
        />
        <CaptchaField config={config} onToken={onCaptcha} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !token} className="store-btn">
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthFormShell>
  )
}
