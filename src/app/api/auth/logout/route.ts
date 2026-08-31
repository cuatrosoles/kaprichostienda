import { NextResponse } from 'next/server'
import { clearCustomerCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  await clearCustomerCookie()
  return NextResponse.json({ ok: true })
}
