'use client'

import { FormEvent, useCallback, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import CaptchaField from '@/components/auth/CaptchaField'
import AuthFormShell from '@/components/auth/AuthFormShell'

export default function ForgotForm() {
  const { config } = useAuth()
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const onToken = useCallback((token: string) => setCaptchaToken(token), [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar')
      setMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormShell title="Recuperar contraseña">
      {message ? (
        <p className="text-sm text-neutral-700">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-neutral-600">
            Ingresá tu email y te enviamos un enlace para elegir una nueva contraseña.
          </p>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="store-input"
            autoComplete="email"
          />
          <CaptchaField config={config} onToken={onToken} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="store-btn">
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/cuenta/ingresar" className="underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthFormShell>
  )
}
