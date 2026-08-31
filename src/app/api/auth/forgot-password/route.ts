import { NextResponse } from 'next/server'
import { verifyCaptcha } from '@/lib/captcha'
import {
  assertSameOrigin,
  clientIp,
  getStoreSettings,
  jsonError,
  normalizeEmail,
  payloadClient,
  rateLimit,
} from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const ip = clientIp(req)
    if (!rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)) {
      return jsonError('Demasiados intentos. Esperá unos minutos.', 429)
    }

    const settings = await getStoreSettings()
    const body = await req.json()
    const email = normalizeEmail(body.email)
    const captcha = await verifyCaptcha(body.captchaToken, settings)
    if (!captcha.ok) return jsonError(captcha.error)

    if (email) {
      const payload = await payloadClient()
      await payload
        .forgotPassword({
          collection: 'customers',
          data: { email },
          context: { storeAuth: true },
        })
        .catch((error) => {
          console.info('Forgot password:', error instanceof Error ? error.message : error)
        })
    }

    return NextResponse.json({
      ok: true,
      message: 'Si el email está registrado, vas a recibir las instrucciones.',
    })
  } catch (error) {
    console.error('Forgot:', error)
    return NextResponse.json({
      ok: true,
      message: 'Si el email está registrado, vas a recibir las instrucciones.',
    })
  }
}
