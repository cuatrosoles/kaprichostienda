import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = new URL(req.url)
    const paymentId =
      body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const paymentApi = new Payment(client)
    const paymentData = await paymentApi.get({ id: paymentId })

    if (paymentData.status !== 'approved' || !paymentData.external_reference) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const payload = await getPayload({ config })
    const order = await payload.findByID({
      collection: 'orders',
      id: paymentData.external_reference,
      depth: 0,
    })

    if (!order || order.paymentStatus === 'approved') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        paymentStatus: 'approved',
        mpPaymentId: String(paymentData.id),
      },
    })

    for (const item of order.items ?? []) {
      const productId = typeof item.product === 'object' ? item.product.id : item.product
      if (!productId) continue

      const product = await payload.findByID({ collection: 'products', id: productId })
      const nextStock = Math.max(0, (product.stock ?? 0) - item.quantity)

      await payload.update({
        collection: 'products',
        id: productId,
        data: { stock: nextStock },
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook Mercado Pago:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
