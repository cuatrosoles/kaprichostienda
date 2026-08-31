import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Customer, StoreSetting } from '@/payload-types'

export const CUSTOMER_COOKIE = 'kaprichos-customer-token'

export type PublicCustomer = {
  id: number
  email: string
  name: string
  phone: string
  loyaltyPoints: number
  birthday: string
  newsletter: boolean
  emailVerified: boolean
}

export type PublicAuthConfig = {
  loginEnabled: boolean
  registrationEnabled: boolean
  requireEmailVerification: boolean
  minPasswordLength: number
  captchaEnabled: boolean
  captchaProvider: 'turnstile' | 'recaptcha'
  captchaSiteKey: string
}

export function toPublicCustomer(doc: Partial<Customer> & { id: number; email: string }): PublicCustomer {
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name || '',
    phone: doc.phone || '',
    loyaltyPoints: Number(doc.loyaltyPoints || 0),
    birthday: doc.birthday || '',
    newsletter: Boolean(doc.newsletter),
    emailVerified: doc.emailVerified !== false,
  }
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export async function payloadClient() {
  return getPayload({ config })
}

export async function getStoreSettings(): Promise<StoreSetting> {
  const payload = await payloadClient()
  return payload.findGlobal({
    slug: 'store-settings',
    overrideAccess: true,
  })
}

export function getPublicAuthConfig(settings: StoreSetting): PublicAuthConfig {
  const provider = settings.captchaProvider === 'recaptcha' ? 'recaptcha' : 'turnstile'
  const envSite =
    provider === 'recaptcha'
      ? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const siteKey = (envSite || settings.captchaSiteKey || '').trim()
  const captchaEnabled = Boolean(settings.captchaEnabled && siteKey)

  return {
    loginEnabled: settings.loginEnabled !== false,
    registrationEnabled: settings.registrationEnabled !== false,
    requireEmailVerification: Boolean(settings.requireEmailVerification),
    minPasswordLength: Math.min(64, Math.max(8, Number(settings.minPasswordLength || 8))),
    captchaEnabled,
    captchaProvider: provider,
    captchaSiteKey: siteKey,
  }
}

export async function getCustomerToken() {
  return (await cookies()).get(CUSTOMER_COOKIE)?.value || null
}

export async function getStoreCustomer(): Promise<PublicCustomer | null> {
  const token = await getCustomerToken()
  if (!token) return null
  try {
    const payload = await payloadClient()
    const headers = new Headers()
    headers.set('Authorization', `JWT ${token}`)
    const { user } = await payload.auth({ headers })
    if (!user || user.collection !== 'customers') return null
    return toPublicCustomer(user as Customer)
  } catch {
    return null
  }
}

export async function setCustomerCookie(token: string, days: number) {
  const store = await cookies()
  store.set(CUSTOMER_COOKIE, token, cookieOptions(Math.max(1, days) * 24 * 60 * 60))
}

export async function clearCustomerCookie() {
  const store = await cookies()
  store.set(CUSTOMER_COOKIE, '', { ...cookieOptions(0), maxAge: 0 })
}

export function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return
  const allowed = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
  const ok = [allowed, ...extra].some((base) => origin === base || origin.startsWith(`${base}`))
  if (!ok) {
    throw new Error('Origen no permitido')
  }
}

const rateBuckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = rateBuckets.get(key)
  if (!current || current.reset < now) {
    rateBuckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  return true
}

export function validatePassword(password: string, minLength: number) {
  if (password.length < minLength) {
    return `La contraseña debe tener al menos ${minLength} caracteres`
  }
  if (password.length > 72) {
    return 'La contraseña es demasiado larga'
  }
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir letras y números'
  }
  return null
}

export function normalizeEmail(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function randomPassword() {
  return randomBytes(32).toString('base64url')
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}
