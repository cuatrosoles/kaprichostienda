import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
})

type CheckoutItem = {
  productId: string
  quantity: number
}

export async function POST(req: Request) {
  try {
    const { items, customer, shippingAddress, shippingCost } = await req.json()
    const payload = await getPayload({ config })

    const validatedItems = await Promise.all(
      (items as CheckoutItem[]).map(async (item) => {
        const prod = await payload.findByID({ collection: 'products', id: item.productId })
        if (!prod || prod.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${prod?.title ?? item.productId}`)
        }
        return {
          id: String(prod.id),
          title: prod.title,
          quantity: item.quantity,
          unit_price: prod.price,
          currency_id: 'ARS' as const,
        }
      }),
    )

    const productsTotal = validatedItems.reduce(
      (acc, curr) => acc + curr.unit_price * curr.quantity,
      0,
    )
    const totalOrderAmount = productsTotal + shippingCost

    const orderRecord = await payload.create({
      collection: 'orders',
      data: {
        paymentStatus: 'pending',
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress,
        items: (items as CheckoutItem[]).map((i, index) => ({
          product: i.productId,
          quantity: i.quantity,
          priceAtPurchase: validatedItems[index].unit_price,
        })),
        shippingCost,
        total: totalOrderAmount,
      },
    })

    const mpItems = [...validatedItems]
    if (shippingCost > 0) {
      mpItems.push({
        id: 'shipping_cost_fee',
        title: 'Costo de Envío a Domicilio',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'ARS',
      })
    }

    const preference = new Preference(client)
    const mpResponse = await preference.create({
      body: {
        items: mpItems,
        payer: { name: customer.name, email: customer.email },
        external_reference: String(orderRecord.id),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SERVER_URL}/carrito?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SERVER_URL}/carrito?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SERVER_URL}/carrito?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_WEBHOOK_URL}/api/webhooks/mercadopago`,
      },
    })

    await payload.update({
      collection: 'orders',
      id: orderRecord.id,
      data: { mpPreferenceId: mpResponse.id },
    })

    return NextResponse.json({ init_point: mpResponse.init_point, preferenceId: mpResponse.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno de checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
