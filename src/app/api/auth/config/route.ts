import { NextResponse } from 'next/server'
import { getPublicAuthConfig, getStoreSettings } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await getStoreSettings()
    return NextResponse.json({ config: getPublicAuthConfig(settings) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({
      config: {
        loginEnabled: true,
        registrationEnabled: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        captchaEnabled: false,
        captchaProvider: 'turnstile',
        captchaSiteKey: '',
      },
    })
  }
}
