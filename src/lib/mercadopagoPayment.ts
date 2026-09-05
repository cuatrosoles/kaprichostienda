import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import { getStoreSettings } from '@/lib/auth'
import { mpAccessToken } from '@/lib/storeCommerce'

const MP_API = 'https://api.mercadopago.com'

export type MercadoPagoPayment = {
  id?: number | string
  status?: string
  external_reference?: string | null
  metadata?: { order_id?: string | number } | null
  order?: { id?: number | string; type?: string } | null
}

type MercadoPagoMerchantOrder = {
  id?: number | string
  preference_id?: string | null
  external_reference?: string | null
  payments?: Array<{ id?: number | string; status?: string }>
}

async function mpToken() {
  const settings = await getStoreSettings().catch(() => null)
  const token = mpAccessToken(settings)
  if (!token) throw new Error('Falta el Access Token de Mercado Pago')
  return token
}

async function mpGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${MP_API}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Mercado Pago respondió ${response.status} en ${path}`)
  }
  return (await response.json()) as T
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  return mpGet<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`, await mpToken())
}

export async function fetchMercadoPagoMerchantOrder(orderId: string): Promise<MercadoPagoMerchantOrder> {
  return mpGet<MercadoPagoMerchantOrder>(`/merchant_orders/${encodeURIComponent(orderId)}`, await mpToken())
}

export async function resolvePaidOrderRef(payment: MercadoPagoPayment): Promise<{
  orderId: string
  preferenceId: string
}> {
  const fromPayment = String(payment.external_reference || payment.metadata?.order_id || '').trim()
  const merchantId = payment.order?.id ? String(payment.order.id) : ''

  if (merchantId) {
    try {
      const merchant = await fetchMercadoPagoMerchantOrder(merchantId)
      return {
        orderId: String(merchant.external_reference || fromPayment || '').trim(),
        preferenceId: String(merchant.preference_id || '').trim(),
      }
    } catch (error) {
      console.warn('No se pudo leer la merchant order de Mercado Pago:', error)
    }
  }

  return { orderId: fromPayment, preferenceId: '' }
}

export async function findStoreOrder(
  payload: Payload,
  args: { orderId?: string; preferenceId?: string; paymentId?: string },
): Promise<Order | null> {
  if (args.orderId && /^\d+$/.test(args.orderId)) {
    try {
      return (await payload.findByID({
        collection: 'orders',
        id: Number(args.orderId),
        depth: 1,
        overrideAccess: true,
      })) as Order
    } catch {
      /* seguir por preferencia */
    }
  }

  if (args.preferenceId) {
    const byPref = await payload.find({
      collection: 'orders',
      where: { mpPreferenceId: { equals: args.preferenceId } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    if (byPref.docs[0]) return byPref.docs[0] as Order
  }

  if (args.paymentId) {
    const byPay = await payload.find({
      collection: 'orders',
      where: { mpPaymentId: { equals: args.paymentId } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    if (byPay.docs[0]) return byPay.docs[0] as Order
  }

  return null
}

type OrderItem = {
  product?: string | number | { id: string | number } | null
  quantity?: number | null
  variantSku?: string | null
}

function productIdFromItem(item: OrderItem): string | number | null {
  if (!item.product) return null
  if (typeof item.product === 'object') return item.product.id
  return item.product
}

export async function applyPaymentStatus(args: {
  payload: Payload
  orderId: string | number
  paymentId: string
  status: 'approved' | 'rejected'
}) {
  const { payload, orderId, paymentId, status } = args
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

    if (order.paymentStatus === status) {
      if (transactionID) await payload.db.commitTransaction(transactionID)
      return order
    }

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        paymentStatus: status,
        mpPaymentId: paymentId,
      },
      overrideAccess: true,
      req,
    })

    if (status === 'approved' && order.paymentStatus !== 'approved') {
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

        const nextVariants = (product.variants || []).map((variant) =>
          item.variantSku && variant.sku === item.variantSku
            ? { ...variant, stock: Math.max(0, Number(variant.stock ?? 0) - quantity) }
            : variant,
        )
        const nextStock = nextVariants.length
          ? nextVariants.reduce((acc, variant) => acc + Number(variant.stock ?? 0), 0)
          : Math.max(0, Number(product.stock ?? 0) - quantity)

        await payload.update({
          collection: 'products',
          id: productId,
          data: { stock: nextStock, variants: nextVariants },
          overrideAccess: true,
          req,
        })
      }
    }

    if (transactionID) await payload.db.commitTransaction(transactionID)
    return order
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function syncMercadoPagoPayment(payload: Payload, paymentId: string) {
  const payment = await fetchMercadoPagoPayment(paymentId)
  const refs = await resolvePaidOrderRef(payment)
  const order = await findStoreOrder(payload, {
    orderId: refs.orderId,
    preferenceId: refs.preferenceId,
    paymentId: String(payment.id ?? paymentId),
  })

  if (!order) {
    console.warn(
      `Pago ${paymentId} sin pedido. ref=${refs.orderId || '-'} preference=${refs.preferenceId || '-'}`,
    )
    return { payment, order: null }
  }

  const mpStatus = payment.status
  if (mpStatus === 'approved') {
    await applyPaymentStatus({
      payload,
      orderId: order.id,
      paymentId: String(payment.id ?? paymentId),
      status: 'approved',
    })
  } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
    await applyPaymentStatus({
      payload,
      orderId: order.id,
      paymentId: String(payment.id ?? paymentId),
      status: 'rejected',
    })
  }

  return { payment, order }
}
