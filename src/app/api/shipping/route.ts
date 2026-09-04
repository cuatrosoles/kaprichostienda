import { NextResponse } from 'next/server'
import { getStoreSettings } from '@/lib/auth'
import { quoteShipping } from '@/lib/shippingQuote'

export async function POST(req: Request) {
  try {
    const { zipCode, totalWeight, orderTotal } = await req.json()
    const settings = await getStoreSettings().catch(() => null)
    const quote = await quoteShipping({
      zipCode: String(zipCode || ''),
      totalWeight: Number(totalWeight || 0),
      orderTotal: Number(orderTotal || 0),
      settings,
    })
    return NextResponse.json(quote)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cotizar logística de envíos'
    const status = message.includes('postal') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
