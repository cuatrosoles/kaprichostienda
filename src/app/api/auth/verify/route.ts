import { NextResponse } from 'next/server'
import { payloadClient } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || ''
  const redirectBase = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

  if (!token) {
    return NextResponse.redirect(`${redirectBase}/cuenta/ingresar?error=verify`)
  }

  try {
    const payload = await payloadClient()
    const found = await payload.find({
      collection: 'customers',
      where: { verifyToken: { equals: token } },
      limit: 1,
      overrideAccess: true,
    })
    const doc = found.docs[0]
    if (!doc) {
      return NextResponse.redirect(`${redirectBase}/cuenta/ingresar?error=verify`)
    }
    const expires = doc.verifyTokenExpires ? new Date(doc.verifyTokenExpires).getTime() : 0
    if (expires && expires < Date.now()) {
      return NextResponse.redirect(`${redirectBase}/cuenta/ingresar?error=verify`)
    }

    await payload.update({
      collection: 'customers',
      id: doc.id,
      data: { emailVerified: true, verifyToken: null, verifyTokenExpires: null },
      overrideAccess: true,
    })

    return NextResponse.redirect(`${redirectBase}/cuenta/ingresar?verified=1`)
  } catch {
    return NextResponse.redirect(`${redirectBase}/cuenta/ingresar?error=verify`)
  }
}
