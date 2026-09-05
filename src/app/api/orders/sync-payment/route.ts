import { NextResponse } from 'next/server'
import { payloadClient } from '@/lib/payload'
import { findStoreOrder, syncMercadoPagoPayment } from '@/lib/mercadopagoPayment'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      paymentId?: string
      orderId?: string
      preferenceId?: string
    }
    const paymentId = String(body.paymentId || '').trim()
    if (!paymentId) {
      return NextResponse.json({ error: 'Falta el pago' }, { status: 400 })
    }

    const payload = await payloadClient()
    const result = await syncMercadoPagoPayment(payload, paymentId)

    if (!result.order && (body.orderId || body.preferenceId)) {
      const fallback = await findStoreOrder(payload, {
        orderId: String(body.orderId || ''),
        preferenceId: String(body.preferenceId || ''),
        paymentId,
      })
      if (fallback && result.payment.status === 'approved') {
        const { applyPaymentStatus } = await import('@/lib/mercadopagoPayment')
        await applyPaymentStatus({
          payload,
          orderId: fallback.id,
          paymentId,
          status: 'approved',
        })
        return NextResponse.json({ ok: true, orderId: fallback.id, status: 'approved' })
      }
    }

    return NextResponse.json({
      ok: true,
      orderId: result.order?.id ?? null,
      status: result.payment.status || null,
    })
  } catch (error) {
    console.error('Sync pago:', error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
