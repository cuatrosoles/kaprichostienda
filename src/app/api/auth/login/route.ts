import { NextResponse } from 'next/server'
import { verifyCaptcha } from '@/lib/captcha'
import {
  assertSameOrigin,
  clientIp,
  getPublicAuthConfig,
  getStoreSettings,
  jsonError,
  normalizeEmail,
  payloadClient,
  rateLimit,
  setCustomerCookie,
} from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const ip = clientIp(req)
    if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
      return jsonError('Demasiados intentos. Esperá unos minutos.', 429)
    }

    const settings = await getStoreSettings()
    const pub = getPublicAuthConfig(settings)
    if (!pub.loginEnabled) return jsonError('El inicio de sesión está deshabilitado.', 403)

    const body = await req.json()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    if (!email || !password) return jsonError('Completá email y contraseña')

    const captcha = await verifyCaptcha(body.captchaToken, settings)
    if (!captcha.ok) return jsonError(captcha.error)

    const payload = await payloadClient()
    const result = await payload.login({
      collection: 'customers',
      data: { email, password },
      context: { storeAuth: true },
    })

    const user = result.user
    if (!user) return jsonError('Email o contraseña incorrectos', 401)
    if (pub.requireEmailVerification && user.emailVerified === false) {
      return jsonError('Verificá tu email antes de entrar. Revisá tu correo.', 403)
    }

    if (!result.token) return jsonError('No se pudo iniciar sesión', 500)
    await setCustomerCookie(result.token, Number(settings.sessionDays || 14))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        loyaltyPoints: Number(user.loyaltyPoints || 0),
        birthday: user.birthday || '',
        newsletter: Boolean(user.newsletter),
        emailVerified: user.emailVerified !== false,
      },
    })
  } catch (error) {
    console.error('Login:', error)
    return jsonError('Email o contraseña incorrectos', 401)
  }
}
