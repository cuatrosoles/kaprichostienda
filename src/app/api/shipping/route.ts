import { NextResponse } from 'next/server'
import { lookupArgentinePostalCode, normalizeArgentineZip } from '@/lib/postalCode'

export async function POST(req: Request) {
  try {
    const { zipCode, totalWeight } = await req.json()
    const { digits } = normalizeArgentineZip(String(zipCode || ''))

    if (digits.length !== 4) {
      return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 })
    }

    const location = await lookupArgentinePostalCode(String(zipCode))

    const baseCost = 4500
    const weightSurcharge = Math.ceil(Number(totalWeight || 0) / 1000) * 850

    let regionalMultiplier = 1.0
    const prefix = parseInt(digits.substring(0, 2), 10)

    if (prefix >= 10 && prefix <= 14) regionalMultiplier = 0.9
    else if (prefix >= 16 && prefix <= 18) regionalMultiplier = 1.0
    else regionalMultiplier = 1.6

    const finalShippingCost = Math.round((baseCost + weightSurcharge) * regionalMultiplier)

    const deliveryOptions = [
      {
        id: 'standard_home',
        name: 'Correo Argentino — Envío a domicilio',
        cost: finalShippingCost,
        eta: '3 a 6 días hábiles',
      },
      {
        id: 'express_home',
        name: 'Envío Express prioritario',
        cost: Math.round(finalShippingCost * 1.45),
        eta: '24 a 48 horas hábiles',
      },
      {
        id: 'pickup',
        name: 'Retiro en punto de correo',
        cost: Math.round(finalShippingCost * 0.75),
        eta: '4 a 7 días hábiles',
      },
    ]

    return NextResponse.json({ options: deliveryOptions, location })
  } catch {
    return NextResponse.json({ error: 'Error al cotizar logística de envíos' }, { status: 500 })
  }
}
