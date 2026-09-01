import { NextResponse } from 'next/server'
import { ensureCustomer } from '@/lib/customers'
import { payloadClient } from '@/lib/payload'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '').toLowerCase().trim()
    if (!email || !email.includes('@')) return NextResponse.json({ ok: true })
    const payload = await payloadClient()
    await ensureCustomer(payload, {
      email,
      name: body.name || '',
      birthday: body.birthday || '',
      newsletter: true,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
