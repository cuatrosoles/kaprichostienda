import { NextResponse } from 'next/server'
import { payloadClient } from '@/lib/payload'

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get('email')
  if (!email) return NextResponse.json({ points: 0 })
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'customers',
      where: { email: { equals: email.toLowerCase() } },
      limit: 1,
      pagination: false,
      overrideAccess: true,
    })
    return NextResponse.json({ points: result.docs[0]?.loyaltyPoints ?? 0 })
  } catch {
    return NextResponse.json({ points: 0 })
  }
}
