import { NextResponse } from 'next/server'
import { getStoreSettings } from '@/lib/auth'
import { getPublicCommerce } from '@/lib/storeCommerce'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await getStoreSettings()
    return NextResponse.json({ commerce: getPublicCommerce(settings) })
  } catch {
    return NextResponse.json({ commerce: getPublicCommerce(null) })
  }
}
