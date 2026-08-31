import { NextResponse } from 'next/server'
import { getStoreCoupon } from '@/lib/storefront'

export async function POST(req: Request) {
  const { code } = await req.json()
  const coupon = await getStoreCoupon(String(code || ''))
  if (!coupon) return NextResponse.json({ error: 'Cupón inválido' }, { status: 400 })
  return NextResponse.json({ coupon })
}
