'use client'

import { FormEvent, useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import CaptchaField from '@/components/auth/CaptchaField'
import AuthFormShell from '@/components/auth/AuthFormShell'

export default function RegisterForm() {
  const { config, setUser } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newsletter: true,
    website: '',
  })
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const onToken = useCallback((token: string) => setCaptchaToken(token), [])

  if (!config.registrationEnabled) {
    return (
      <AuthFormShell title="Crear cuenta">
        <p className="text-sm text-neutral-600">El registro está deshabilitado por ahora.</p>
        <Link href="/cuenta/ingresar" className="mt-4 inline-block underline">
          Iniciar sesión
        </Link>
      </AuthFormShell>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar')
      if (data.needsVerification) {
        setMessage(data.message)
        return
      }
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
    <AuthFormShell title="Crear cuenta">
      {message ? (
        <p className="text-sm text-kap-green">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            required
            placeholder="Nombre y apellido"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="store-input"
            autoComplete="name"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="store-input"
            autoComplete="email"
          />
          <input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="store-input"
            autoComplete="tel"
          />
          <input
            type="password"
            required
            placeholder={`Contraseña (mín. ${config.minPasswordLength}, letras y números)`}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="store-input"
            autoComplete="new-password"
          />
          <input
            type="password"
            required
            placeholder="Repetir contraseña"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="store-input"
            autoComplete="new-password"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={form.newsletter}
              onChange={(e) => setForm({ ...form, newsletter: e.target.checked })}
            />
            Quiero recibir novedades y cupones
          </label>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="hidden"
            aria-hidden
          />
          <CaptchaField config={config} onToken={onToken} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="store-btn">
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-neutral-600">
        ¿Ya tenés cuenta?{' '}
        <Link href="/cuenta/ingresar" className="underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthFormShell>
  )
}
