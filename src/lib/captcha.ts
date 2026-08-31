import type { StoreSetting } from '@/payload-types'
import { getStoreSettings } from '@/lib/auth'

export async function verifyCaptcha(token: string | undefined, settings: StoreSetting) {
  const provider = settings.captchaProvider === 'recaptcha' ? 'recaptcha' : 'turnstile'
  const envSite =
    provider === 'recaptcha'
      ? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const envSecret =
    provider === 'recaptcha' ? process.env.RECAPTCHA_SECRET_KEY : process.env.TURNSTILE_SECRET_KEY
  const siteKey = (envSite || settings.captchaSiteKey || '').trim()
  const secret = (envSecret || settings.captchaSecretKey || '').trim()
  const enabled = Boolean(settings.captchaEnabled && siteKey)

  if (!enabled) return { ok: true as const }

  if (!token) {
    return { ok: false as const, error: 'Completá el captcha' }
  }
  if (!secret) {
    console.error('Captcha activado pero falta la secret key')
    return { ok: false as const, error: 'Captcha no disponible. Probá más tarde.' }
  }

  const endpoint =
    provider === 'recaptcha'
      ? 'https://www.google.com/recaptcha/api/siteverify'
      : 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

  const body = new URLSearchParams({ secret, response: token })
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const data = (await response.json()) as { success?: boolean }
  if (!data.success) {
    return { ok: false as const, error: 'Captcha inválido. Volvé a intentar.' }
  }
  return { ok: true as const }
}

export async function requireCaptcha(token: string | undefined) {
  const settings = await getStoreSettings()
  return verifyCaptcha(token, settings)
}
