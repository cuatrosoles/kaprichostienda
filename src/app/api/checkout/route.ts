import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { POINT_VALUE_ARS, POINTS_PER_THOUSAND } from '@/data/catalog'
import { findStoreProductDoc, getStoreCoupon, mapProduct } from '@/lib/storefront'
import { getStoreSettings, randomPassword } from '@/lib/auth'
import { payloadClient } from '@/lib/payload'
import {
  cashDiscountRate,
  mpAccessToken,
  paymentsWebhookBase,
  storefrontUrl,
  transferDetails,
} from '@/lib/storeCommerce'

export const runtime = 'nodejs'
export const maxDuration = 60

type CheckoutItem = {
  productId: string
  variantSku?: string
  quantity: number
  size?: string
  color?: string
}

export async function POST(req: Request) {
  try {
    const {
      items,
      customer,
      shippingAddress,
      shippingCost,
      couponCode,
      loyaltyPoints = 0,
      payMethod = 'mp',
    } = await req.json()

    const validatedItems = []
    for (const item of items as CheckoutItem[]) {
      const doc = await findStoreProductDoc(item.productId)
      if (!doc || doc.status !== 'published') throw new Error('Producto no encontrado')
      const prod = mapProduct(doc)
      const variant = item.variantSku
        ? prod.variants.find((v) => v.sku === item.variantSku)
        : prod.variants[0]
      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${prod.title}`)
      }
      validatedItems.push({
        id: prod.id,
        title: `${prod.title} (${variant.color} / ${variant.size})`,
        quantity: item.quantity,
        unit_price: prod.price,
        currency_id: 'ARS' as const,
        variant,
        product: prod,
        size: variant.size,
        color: variant.color,
      })
    }

    const productsTotal = validatedItems.reduce(
      (acc, curr) => acc + curr.unit_price * curr.quantity,
      0,
    )
    const settings = await getStoreSettings().catch(() => null)
    const mpOn = settings?.mpEnabled !== false
    const transferOn = settings?.transferEnabled !== false
    if (payMethod === 'mp' && !mpOn) {
      return NextResponse.json({ error: 'Mercado Pago no está habilitado.' }, { status: 400 })
    }
    if (payMethod === 'transfer' && !transferOn) {
      return NextResponse.json({ error: 'La transferencia no está habilitada.' }, { status: 400 })
    }
    if (payMethod !== 'mp' && payMethod !== 'transfer') {
      return NextResponse.json({ error: 'Elegí un medio de pago.' }, { status: 400 })
    }
    if (payMethod === 'mp' && !mpAccessToken(settings)) {
      return NextResponse.json(
        { error: 'Mercado Pago no tiene Access Token. Cargalo en Ajustes generales → Pagos.' },
        { status: 400 },
      )
    }

    const afterCash =
      payMethod === 'transfer' ? Math.round(productsTotal * (1 - cashDiscountRate(settings))) : productsTotal
    const coupon = await getStoreCoupon(String(couponCode || ''))
    const couponDiscount =
      coupon?.type === 'percent' ? Math.round(afterCash * (coupon.value / 100)) : 0
    const ship = coupon?.type === 'shipping' ? 0 : Number(shippingCost || 0)
    const pointsUsed = Math.max(0, Number(loyaltyPoints) || 0)
    const pointsDiscount = pointsUsed * POINT_VALUE_ARS
    const totalOrderAmount = Math.max(0, afterCash - couponDiscount - pointsDiscount + ship)

    const payload = await payloadClient()

    const orderRecord = await payload.create({
      collection: 'orders',
      data: {
        paymentStatus: payMethod === 'transfer' ? 'pending' : 'pending',
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress,
        items: validatedItems.map((i) => ({
          product: Number(i.id),
          quantity: i.quantity,
          priceAtPurchase: i.unit_price,
          variantSku: i.variant.sku,
          size: i.size,
          color: i.color,
        })),
        shippingCost: ship,
        discount: couponDiscount + pointsDiscount + (productsTotal - afterCash),
        couponCode: coupon?.code || '',
        loyaltyPointsUsed: pointsUsed,
        total: totalOrderAmount,
      },
      overrideAccess: true,
    })

    if (customer.email) {
      const existing = await payload.find({
        collection: 'customers',
        where: { email: { equals: String(customer.email).toLowerCase() } },
        limit: 1,
        overrideAccess: true,
      })
      const earned = Math.floor(totalOrderAmount / 1000) * POINTS_PER_THOUSAND
      if (existing.docs[0]) {
        const current = Number(existing.docs[0].loyaltyPoints || 0)
        await payload.update({
          collection: 'customers',
          id: existing.docs[0].id,
          data: {
            name: customer.name,
            phone: customer.phone,
            loyaltyPoints: Math.max(0, current - pointsUsed + (payMethod === 'transfer' ? 0 : earned)),
          },
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'customers',
          data: {
            email: String(customer.email).toLowerCase(),
            name: customer.name,
            phone: customer.phone,
            loyaltyPoints: 0,
            password: randomPassword(),
            emailVerified: true,
          },
          overrideAccess: true,
          context: { storeAuth: true },
        })
      }
    }

    if (payMethod === 'transfer') {
      const { notifySale } = await import('@/lib/adminNotify')
      const full = await payload.findByID({
        collection: 'orders',
        id: orderRecord.id,
        depth: 1,
        overrideAccess: true,
      })
      await notifySale(payload, full)
      return NextResponse.json({
        ok: true,
        orderId: orderRecord.id,
        total: totalOrderAmount,
        transfer: transferDetails(settings),
        message: 'Pedido creado. Completá la transferencia para confirmarlo.',
      })
    }

    const accessToken = mpAccessToken(settings)

    const mpItems = validatedItems.map((i) => ({
      id: i.variant.sku,
      title: i.title,
      quantity: i.quantity,
      unit_price: i.unit_price,
      currency_id: 'ARS' as const,
    }))
    if (ship > 0) {
      mpItems.push({
        id: 'shipping_cost_fee',
        title: 'Costo de Envío a Domicilio',
        quantity: 1,
        unit_price: ship,
        currency_id: 'ARS',
      })
    }
    if (couponDiscount + pointsDiscount > 0) {
      mpItems.push({
        id: 'discount',
        title: 'Descuento',
        quantity: 1,
        unit_price: -(couponDiscount + pointsDiscount),
        currency_id: 'ARS',
      })
    }

    const site = storefrontUrl(settings)
    const hooks = paymentsWebhookBase(settings)
    const preference = new Preference(new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } }))
    const mpResponse = await preference.create({
      body: {
        items: mpItems,
        payer: { name: customer.name, email: customer.email },
        external_reference: String(orderRecord.id),
        back_urls: {
          success: `${site}/carrito?status=success`,
          failure: `${site}/carrito?status=failure`,
          pending: `${site}/carrito?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${hooks}/api/webhooks/mercadopago`,
      },
    })

    await payload.update({
      collection: 'orders',
      id: orderRecord.id,
      data: { mpPreferenceId: mpResponse.id },
      overrideAccess: true,
    })

    return NextResponse.json({ init_point: mpResponse.init_point, preferenceId: mpResponse.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno de checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
