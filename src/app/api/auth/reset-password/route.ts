import { NextResponse } from 'next/server'
import { verifyCaptcha } from '@/lib/captcha'
import {
  assertSameOrigin,
  clientIp,
  getPublicAuthConfig,
  getStoreSettings,
  jsonError,
  payloadClient,
  rateLimit,
  setCustomerCookie,
  toPublicCustomer,
  validatePassword,
} from '@/lib/auth'
import type { Customer } from '@/payload-types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const ip = clientIp(req)
    if (!rateLimit(`reset:${ip}`, 8, 15 * 60 * 1000)) {
      return jsonError('Demasiados intentos. Esperá unos minutos.', 429)
    }

    const settings = await getStoreSettings()
    const pub = getPublicAuthConfig(settings)
    const body = await req.json()
    const token = String(body.token || '')
    const password = String(body.password || '')
    const confirm = String(body.confirmPassword || '')

    if (!token) return jsonError('El enlace no es válido o venció')
    if (password !== confirm) return jsonError('Las contraseñas no coinciden')
    const passwordError = validatePassword(password, pub.minPasswordLength)
    if (passwordError) return jsonError(passwordError)

    const captcha = await verifyCaptcha(body.captchaToken, settings)
    if (!captcha.ok) return jsonError(captcha.error)

    const payload = await payloadClient()
    const result = await payload.resetPassword({
      collection: 'customers',
      data: { token, password },
      overrideAccess: true,
      context: { storeAuth: true },
    })

    if (result.token) {
      await setCustomerCookie(result.token, Number(settings.sessionDays || 14))
    }

    const user = result.user
      ? toPublicCustomer(result.user as unknown as Customer)
      : null

    return NextResponse.json({ ok: true, user })
  } catch (error) {
    console.error('Reset:', error)
    return jsonError('El enlace no es válido o venció', 400)
  }
}
