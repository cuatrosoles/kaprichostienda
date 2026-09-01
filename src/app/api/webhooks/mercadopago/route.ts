import { NextResponse } from 'next/server'
import type { Payload } from 'payload'
import { payloadClient } from '@/lib/payload'

export const runtime = 'nodejs'
export const maxDuration = 60

const MP_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'
const ACK = { received: true } as const

type MercadoPagoPayment = {
  id?: number | string
  status?: string
  external_reference?: string | null
}

type OrderItem = {
  product?: string | number | { id: string | number } | null
  quantity?: number | null
  variantSku?: string | null
}

function ack() {
  return NextResponse.json(ACK, { status: 200 })
}

function extractPaymentId(req: Request, body: Record<string, unknown>): string | null {
  const url = new URL(req.url)
  const fromQuery =
    url.searchParams.get('data.id') ||
    url.searchParams.get('id') ||
    url.searchParams.get('data_id')

  const data = body.data
  const fromBody =
    (data && typeof data === 'object' && 'id' in data
      ? String((data as { id?: unknown }).id ?? '')
      : '') || (typeof body.id === 'string' || typeof body.id === 'number' ? String(body.id) : '')

  const paymentId = (fromQuery || fromBody).trim()
  return paymentId || null
}

function isPaymentNotification(req: Request, body: Record<string, unknown>): boolean {
  const url = new URL(req.url)
  const topic = url.searchParams.get('type') || url.searchParams.get('topic') || String(body.type ?? '')
  return !topic || topic === 'payment'
}

async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN')
  }

  const response = await fetch(`${MP_PAYMENTS_URL}/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Mercado Pago respondió ${response.status} al consultar el pago ${paymentId}`)
  }

  return (await response.json()) as MercadoPagoPayment
}

function productIdFromItem(item: OrderItem): string | number | null {
  if (!item.product) return null
  if (typeof item.product === 'object') return item.product.id
  return item.product
}

async function applyApprovedPayment(args: {
  payload: Payload
  orderId: string
  paymentId: string
}) {
  const { payload, orderId, paymentId } = args
  const transactionID = await payload.db.beginTransaction()
  const req = transactionID != null ? { transactionID } : undefined

  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (order.paymentStatus === 'approved') {
      if (transactionID) await payload.db.commitTransaction(transactionID)
      return
    }

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        paymentStatus: 'approved',
        mpPaymentId: paymentId,
      },
      overrideAccess: true,
      req,
    })

    for (const item of (order.items ?? []) as OrderItem[]) {
      const productId = productIdFromItem(item)
      const quantity = Number(item.quantity ?? 0)
      if (!productId || quantity <= 0) continue

      const product = await payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        overrideAccess: true,
        req,
      })

      const nextVariants = (product.variants || []).map((v) =>
        item.variantSku && v.sku === item.variantSku
          ? { ...v, stock: Math.max(0, Number(v.stock ?? 0) - quantity) }
          : v,
      )
      const nextStock = nextVariants.length
        ? nextVariants.reduce((acc, v) => acc + Number(v.stock ?? 0), 0)
        : Math.max(0, Number(product.stock ?? 0) - quantity)

      await payload.update({
        collection: 'products',
        id: productId,
        data: { stock: nextStock, variants: nextVariants },
        overrideAccess: true,
        req,
      })
    }

    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function GET() {
  return ack()
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    if (!isPaymentNotification(req, body)) {
      return ack()
    }

    const paymentId = extractPaymentId(req, body)
    if (!paymentId) {
      console.warn('Webhook Mercado Pago sin data.id')
      return ack()
    }

    const payment = await fetchMercadoPagoPayment(paymentId)
    const orderId = payment.external_reference?.trim()

    if (!orderId) {
      console.warn(`Pago ${paymentId} sin external_reference`)
      return ack()
    }

    if (payment.status !== 'approved') {
      if (payment.status === 'rejected' || payment.status === 'cancelled') {
        const payload = await payloadClient()
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            paymentStatus: 'rejected',
            mpPaymentId: String(payment.id ?? paymentId),
          },
          overrideAccess: true,
        })
      }
      return ack()
    }

    const payload = await payloadClient()
    await applyApprovedPayment({
      payload,
      orderId,
      paymentId: String(payment.id ?? paymentId),
    })

    return ack()
  } catch (error) {
    console.error('Webhook Mercado Pago:', error)
    return ack()
  }
}
