'use client'

import { FormEvent, useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import CaptchaField from '@/components/auth/CaptchaField'
import AuthFormShell from '@/components/auth/AuthFormShell'

export default function LoginForm() {
  const { config, setUser } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState(
    params.get('error') === 'verify' ? 'El enlace de verificación no es válido o venció.' : '',
  )
  const [info] = useState(
    params.get('verified') === '1' ? 'Email confirmado. Ya podés iniciar sesión.' : '',
  )
  const [loading, setLoading] = useState(false)
  const onToken = useCallback((token: string) => setCaptchaToken(token), [])

  if (!config.loginEnabled) {
    return (
      <AuthFormShell title="Iniciar sesión">
        <p className="text-sm text-neutral-600">El inicio de sesión está deshabilitado por ahora.</p>
      </AuthFormShell>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (config.captchaEnabled && !captchaToken) {
      setError('Completá el captcha para ingresar.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo entrar')
      setUser(data.user)
      router.push('/cuenta')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormShell title="Iniciar sesión">
      {info && <p className="mb-4 bg-kap-green px-3 py-2 text-sm text-white">{info}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="store-input"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="store-input"
        />
        <CaptchaField config={config} onToken={onToken} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="store-btn">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p className="mt-6 text-sm text-neutral-600">
        <Link href="/cuenta/recuperar" className="underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        ¿No tenés cuenta?{' '}
        <Link href="/cuenta/registro" className="underline">
          Crear cuenta
        </Link>
      </p>
    </AuthFormShell>
  )
}
