import { NextResponse } from 'next/server'
import { getStoreCustomer } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getStoreCustomer()
  return NextResponse.json({ user })
}
