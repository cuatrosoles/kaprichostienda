import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { zipCode, totalWeight } = await req.json()

    if (!zipCode || zipCode.length < 4) {
      return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 })
    }

    const baseCost = 4500
    const weightSurcharge = Math.ceil(totalWeight / 1000) * 850

    let regionalMultiplier = 1.0
    const prefix = parseInt(String(zipCode).substring(0, 2), 10)

    if (prefix >= 10 && prefix <= 14) regionalMultiplier = 0.9
    else if (prefix >= 16 && prefix <= 18) regionalMultiplier = 1.0
    else regionalMultiplier = 1.6

    const finalShippingCost = Math.round((baseCost + weightSurcharge) * regionalMultiplier)

    const deliveryOptions = [
      {
        id: 'standard_home',
        name: 'Envío Estándar a Domicilio',
        cost: finalShippingCost,
        eta: '3 a 6 días hábiles',
      },
      {
        id: 'express_home',
        name: 'Envío Express prioritario',
        cost: Math.round(finalShippingCost * 1.45),
        eta: '24 a 48 horas hábiles',
      },
    ]

    return NextResponse.json({ options: deliveryOptions })
  } catch {
    return NextResponse.json({ error: 'Error al cotizar logística de envíos' }, { status: 500 })
  }
}
