import { NextResponse } from 'next/server'
import {
  getPublicAuthConfig,
  getStoreCustomer,
  getStoreSettings,
  jsonError,
  payloadClient,
  setCustomerCookie,
  validatePassword,
} from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const current = await getStoreCustomer()
  if (!current) return jsonError('Tenés que iniciar sesión', 401)

  const settings = await getStoreSettings()
  const pub = getPublicAuthConfig(settings)
  const body = await req.json()
  const currentPassword = String(body.currentPassword || '')
  const password = String(body.password || '')
  const confirm = String(body.confirmPassword || '')

  if (!currentPassword) return jsonError('Ingresá tu contraseña actual')
  if (password !== confirm) return jsonError('Las contraseñas no coinciden')
  const passwordError = validatePassword(password, pub.minPasswordLength)
  if (passwordError) return jsonError(passwordError)

  const payload = await payloadClient()
  try {
    await payload.login({
      collection: 'customers',
      data: { email: current.email, password: currentPassword },
      context: { storeAuth: true },
    })
  } catch {
    return jsonError('La contraseña actual no es correcta', 401)
  }

  const result = await payload.update({
    collection: 'customers',
    id: current.id,
    data: { password },
    overrideAccess: true,
  })

  const login = await payload.login({
    collection: 'customers',
    data: { email: current.email, password },
    context: { storeAuth: true },
  })
  if (login.token) {
    await setCustomerCookie(login.token, Number(settings.sessionDays || 14))
  }

  return NextResponse.json({ ok: true, id: result.id })
}
