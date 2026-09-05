'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'

function firstParam(params: URLSearchParams, key: string) {
  return params.getAll(key).filter(Boolean)[0] || ''
}

export default function OrderReturnView() {
  const params = useSearchParams()
  const { clear } = useCart()
  const collectionStatus = firstParam(params, 'collection_status')
  const paymentStatus = firstParam(params, 'status')
  const orderId = firstParam(params, 'external_reference')
  const paymentId = firstParam(params, 'payment_id') || firstParam(params, 'collection_id')

  const approved = collectionStatus === 'approved' || paymentStatus === 'approved' || paymentStatus === 'success'
  const pending = collectionStatus === 'pending' || paymentStatus === 'pending'
  const failed = !approved && !pending && (collectionStatus === 'rejected' || paymentStatus === 'failure' || paymentStatus === 'rejected')

  useEffect(() => {
    if (approved || pending) clear()
  }, [approved, pending, clear])

  useEffect(() => {
    if (!paymentId) return
    void fetch('/api/orders/sync-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId,
        orderId,
        preferenceId: firstParam(params, 'preference_id'),
      }),
    }).catch(() => {})
  }, [paymentId, orderId, params])

  const title = approved ? 'Pago confirmado' : pending ? 'Pago en proceso' : failed ? 'El pago no se completó' : 'Volviste del pago'
  const text = approved
    ? 'Gracias por tu compra. Ya registramos el pedido y te vamos a contactar para coordinar la entrega o el retiro.'
    : pending
      ? 'Mercado Pago todavía está procesando el pago. Cuando se acredite, el pedido queda confirmado.'
      : failed
        ? 'No se acreditó el pago. Podés volver al carrito e intentar de nuevo con el mismo u otro medio.'
        : 'Si pagaste, el pedido ya está en el sistema. Si no, volvé al carrito para terminar la compra.'

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">Kaprichos</p>
      <h1 className="mt-3 font-display text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{text}</p>
      {(orderId || paymentId) && (
        <div className="mt-6 border border-neutral-200 bg-[#f7f4ef] px-4 py-3 text-left text-sm">
          {orderId ? (
            <p>
              <span className="text-neutral-500">Pedido</span> #{orderId}
            </p>
          ) : null}
          {paymentId ? (
            <p className="mt-1">
              <span className="text-neutral-500">Pago</span> {paymentId}
            </p>
          ) : null}
        </div>
      )}
      <div className="mt-8 flex flex-col items-center gap-3">
        {failed ? (
          <Link href="/carrito" className="store-btn w-auto min-w-52">
            Volver al carrito
          </Link>
        ) : (
          <Link href="/productos" className="store-btn w-auto min-w-52">
            Seguir comprando
          </Link>
        )}
        <Link href="/" className="text-xs uppercase tracking-nav underline">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
