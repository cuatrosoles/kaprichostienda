import { NextResponse } from 'next/server'
import { getStoreCustomer, jsonError, payloadClient, toPublicCustomer } from '@/lib/auth'
import type { Customer } from '@/payload-types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const current = await getStoreCustomer()
  if (!current) return jsonError('Tenés que iniciar sesión', 401)

  const body = await req.json()
  const payload = await payloadClient()
  const updated = await payload.update({
    collection: 'customers',
    id: current.id,
    data: {
      name: String(body.name || '').trim(),
      phone: String(body.phone || '').trim(),
      birthday: String(body.birthday || '').trim(),
      newsletter: Boolean(body.newsletter),
    },
    overrideAccess: true,
  })

  return NextResponse.json({ user: toPublicCustomer(updated as Customer) })
}
