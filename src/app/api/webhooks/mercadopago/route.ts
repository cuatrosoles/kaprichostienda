import { NextResponse } from 'next/server'
import { payloadClient } from '@/lib/payload'
import {
  fetchMercadoPagoMerchantOrder,
  syncMercadoPagoPayment,
} from '@/lib/mercadopagoPayment'

export const runtime = 'nodejs'
export const maxDuration = 60

const ACK = { received: true } as const

function ack() {
  return NextResponse.json(ACK, { status: 200 })
}

function notificationId(req: Request, body: Record<string, unknown>) {
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
  return (fromQuery || fromBody).trim()
}

function notificationTopic(req: Request, body: Record<string, unknown>) {
  const url = new URL(req.url)
  return (
    url.searchParams.get('type') ||
    url.searchParams.get('topic') ||
    String(body.type ?? body.topic ?? 'payment')
  ).toLowerCase()
}

export async function GET() {
  return ack()
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const topic = notificationTopic(req, body)
    const id = notificationId(req, body)
    if (!id) {
      console.warn('Webhook Mercado Pago sin id')
      return ack()
    }

    const payload = await payloadClient()

    if (topic.includes('merchant_order')) {
      const merchant = await fetchMercadoPagoMerchantOrder(id)
      const paid = (merchant.payments || []).find((row) => row.status === 'approved' && row.id)
      if (paid?.id) {
        await syncMercadoPagoPayment(payload, String(paid.id))
      }
      return ack()
    }

    if (topic && !topic.includes('payment')) {
      return ack()
    }

    await syncMercadoPagoPayment(payload, id)
    return ack()
  } catch (error) {
    console.error('Webhook Mercado Pago:', error)
    return ack()
  }
}
