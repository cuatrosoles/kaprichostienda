import { randomBytes } from 'node:crypto'
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
  toPublicCustomer,
  validatePassword,
} from '@/lib/auth'
import type { Customer } from '@/payload-types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const ip = clientIp(req)
    if (!rateLimit(`register:${ip}`, 6, 15 * 60 * 1000)) {
      return jsonError('Demasiados intentos. Esperá unos minutos.', 429)
    }

    const settings = await getStoreSettings()
    const pub = getPublicAuthConfig(settings)
    if (!pub.registrationEnabled) return jsonError('El registro está deshabilitado.', 403)

    const body = await req.json()
    if (body.website) return jsonError('No se pudo completar el registro')

    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    const confirm = String(body.confirmPassword || '')
    const name = String(body.name || '').trim()
    const phone = String(body.phone || '').trim()

    if (!email || !email.includes('@')) return jsonError('Ingresá un email válido')
    if (!name) return jsonError('Ingresá tu nombre')
    if (password !== confirm) return jsonError('Las contraseñas no coinciden')
    const passwordError = validatePassword(password, pub.minPasswordLength)
    if (passwordError) return jsonError(passwordError)

    const captcha = await verifyCaptcha(body.captchaToken, settings)
    if (!captcha.ok) return jsonError(captcha.error)

    const payload = await payloadClient()
    const exists = await payload.find({
      collection: 'customers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })

    if (exists.docs[0]) {
      const hasHash = Boolean(exists.docs[0].hash)
      if (hasHash) {
        return jsonError('Ese email ya tiene una cuenta. Iniciá sesión o recuperá la contraseña.')
      }
      await payload.update({
        collection: 'customers',
        id: exists.docs[0].id,
        data: { name, phone, password, emailVerified: !pub.requireEmailVerification },
        overrideAccess: true,
        context: { storeAuth: true },
      })
    } else {
      await payload.create({
        collection: 'customers',
        data: {
          email,
          password,
          name,
          phone,
          loyaltyPoints: 0,
          newsletter: Boolean(body.newsletter),
          emailVerified: !pub.requireEmailVerification,
        },
        overrideAccess: true,
        context: { storeAuth: true },
      })
    }

    const created = await payload.find({
      collection: 'customers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    const doc = created.docs[0]
    if (!doc) return jsonError('No se pudo crear la cuenta', 500)

    if (pub.requireEmailVerification) {
      const token = randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await payload.update({
        collection: 'customers',
        id: doc.id,
        data: { verifyToken: token, verifyTokenExpires: expires, emailVerified: false },
        overrideAccess: true,
      })
      const url = `${(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/auth/verify?token=${encodeURIComponent(token)}`
      await payload.sendEmail({
        to: email,
        subject: 'Confirmá tu email — Kaprichos',
        html: `<p>Hola ${name || ''},</p><p>Confirmá tu cuenta:</p><p><a href="${url}">Verificar email</a></p>`,
      })
      return NextResponse.json({
        ok: true,
        needsVerification: true,
        message: 'Te enviamos un email para confirmar la cuenta.',
      })
    }

    const login = await payload.login({
      collection: 'customers',
      data: { email, password },
      context: { storeAuth: true },
    })
    if (login.token) {
      await setCustomerCookie(login.token, Number(settings.sessionDays || 14))
    }

    return NextResponse.json({ user: toPublicCustomer(doc as Customer) })
  } catch (error) {
    console.error('Registro:', error)
    return jsonError('No se pudo completar el registro', 500)
  }
}
