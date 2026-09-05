'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { type CatalogCoupon, formatARS, POINT_VALUE_ARS, POINTS_PER_THOUSAND } from '@/data/catalog'
import { useCashDiscountRate, useCommerce } from '@/context/CommerceContext'
import type { PostalLocation } from '@/lib/postalCode'
import CatalogImage from '@/components/store/CatalogImage'

type ShippingOption = { id: string; name: string; cost: number; eta: string }

export default function CarritoView() {
  const { items, subtotal, updateQty, removeItem, clear } = useCart()
  const { user } = useAuth()
  const commerce = useCommerce()
  const cashRate = useCashDiscountRate()
  const [zipCode, setZipCode] = useState('')
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [shippingLocation, setShippingLocation] = useState<PostalLocation | null>(null)
  const [shippingError, setShippingError] = useState('')
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<CatalogCoupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [payMethod, setPayMethod] = useState<'mp' | 'transfer'>(commerce.mpEnabled ? 'mp' : 'transfer')
  const [transferInfo, setTransferInfo] = useState<null | {
    bank?: string
    holder?: string
    cbu?: string
    alias?: string
    instructions?: string
  }>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [availablePoints, setAvailablePoints] = useState(0)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [address, setAddress] = useState({ street: '', floorAppart: '', city: '', province: '' })

  useEffect(() => {
    if (!user) return
    setCustomer({ name: user.name, email: user.email, phone: user.phone })
    setAvailablePoints(user.loyaltyPoints)
  }, [user])

  useEffect(() => {
    if (payMethod === 'mp' && !commerce.mpEnabled && commerce.transferEnabled) setPayMethod('transfer')
    if (payMethod === 'transfer' && !commerce.transferEnabled && commerce.mpEnabled) setPayMethod('mp')
  }, [commerce.mpEnabled, commerce.transferEnabled, payMethod])

  const totalWeight = items.reduce((acc, item) => acc + item.weight * item.quantity, 0)
  const discountedSubtotal =
    payMethod === 'transfer' ? Math.round(subtotal * (1 - cashRate)) : subtotal
  const couponDiscount =
    coupon?.type === 'percent' ? Math.round(discountedSubtotal * (coupon.value / 100)) : 0
  const afterCoupon = discountedSubtotal - couponDiscount
  const pointsValue = Math.min(loyaltyPoints, availablePoints) * POINT_VALUE_ARS
  const shippingCost =
    coupon?.type === 'shipping' ? 0 : selectedShipping ? selectedShipping.cost : 0
  const grandTotal = Math.max(0, afterCoupon - pointsValue + shippingCost)

  const handleCalculateShipping = async () => {
    if (!zipCode.trim()) return
    setLoadingShipping(true)
    setShippingError('')
    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, totalWeight, orderTotal: subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.options) {
        setShippingOptions([])
        setSelectedShipping(null)
        setShippingLocation(null)
        setShippingError(data.error || 'No se pudo calcular el envío')
        return
      }
      setShippingOptions(data.options)
      setSelectedShipping(data.options[0])
      const location = data.location as PostalLocation | null
      setShippingLocation(location)
      if (location) {
        setAddress((prev) => ({
          ...prev,
          city: location.locality || location.city || prev.city,
          province: location.province || prev.province,
        }))
      }
    } finally {
      setLoadingShipping(false)
    }
  }

  const applyCoupon = async () => {
    setCouponError('')
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode }),
    })
    const data = await res.json()
    if (!data.coupon) {
      setCoupon(null)
      setCouponError(data.error || 'Cupón inválido')
      return
    }
    setCoupon(data.coupon)
  }

  const loadPoints = async () => {
    if (!customer.email) return
    const res = await fetch(`/api/loyalty?email=${encodeURIComponent(customer.email)}`)
    const data = await res.json()
    setAvailablePoints(Number(data.points || 0))
  }

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedShipping && coupon?.type !== 'shipping') {
      return alert('Calculá y seleccioná una opción de envío')
    }
    setIsProcessingCheckout(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantSku: item.sku,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          customer,
          shippingAddress: { ...address, zipCode },
          shippingCost,
          couponCode: coupon?.code,
          loyaltyPoints: Math.min(loyaltyPoints, availablePoints),
          payMethod,
        }),
      })
      const data = await res.json()
      if (data.init_point) {
        clear()
        window.location.href = data.init_point
        return
      }
      if (data.ok) {
        clear()
        setTransferInfo(
          data.transfer || {
            bank: commerce.transferBank,
            holder: commerce.transferHolder,
            cbu: commerce.transferCbu,
            alias: commerce.transferAlias,
            instructions: commerce.transferInstructions,
          },
        )
        setStatus('Pedido registrado. Completá la transferencia con estos datos:')
        return
      }
      throw new Error(data.error || 'Fallo de procesamiento')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  const empty = items.length === 0

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-10 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl">Tu carrito</h1>
        {status && (
          <div className="mt-4 space-y-2 bg-kap-green px-4 py-3 text-sm text-white">
            <p>{status}</p>
            {transferInfo && (
              <div className="whitespace-pre-line text-xs text-white/90">
                {transferInfo.holder ? `Titular: ${transferInfo.holder}\n` : ''}
                {transferInfo.bank ? `Banco: ${transferInfo.bank}\n` : ''}
                {transferInfo.cbu ? `CBU/CVU: ${transferInfo.cbu}\n` : ''}
                {transferInfo.alias ? `Alias: ${transferInfo.alias}\n` : ''}
                {transferInfo.instructions || ''}
              </div>
            )}
          </div>
        )}
        <div className="mt-6 divide-y border">
          {empty ? (
            <p className="p-4 text-sm text-neutral-500">Tu carrito está vacío.</p>
          ) : (
            items.map((item) => (
              <div key={item.sku} className="flex gap-3 p-4">
                <CatalogImage src={item.image} alt={item.title} className="h-24 w-16 shrink-0 object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-neutral-500">
                    {item.color} / {item.size}
                  </p>
                  <p className="text-sm">{formatARS(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(item.sku, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.sku, item.quantity + 1)}>
                      +
                    </button>
                    <button type="button" className="ml-4 text-xs underline" onClick={() => removeItem(item.sku)}>
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 space-y-3 border p-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest">Envío nacional</h3>
          <div className="flex gap-2">
            <input
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value)
                setShippingError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleCalculateShipping()
                }
              }}
              placeholder="Código postal"
              inputMode="numeric"
              autoComplete="postal-code"
              className="store-input"
            />
            <button type="button" onClick={handleCalculateShipping} className="store-btn-outline whitespace-nowrap">
              {loadingShipping ? '...' : 'Calcular'}
            </button>
          </div>
          {shippingError && <p className="text-xs text-red-600">{shippingError}</p>}
          {shippingLocation && (
            <div className="border border-kap-green/30 bg-[#f4f7f4] px-3 py-2 text-sm">
              <p className="font-medium text-kap-green">
                CP {shippingLocation.zipCode} · {shippingLocation.label}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {shippingLocation.locality && shippingLocation.locality !== shippingLocation.city
                  ? `Localidad: ${shippingLocation.locality} · Ciudad: ${shippingLocation.city} · Provincia: ${shippingLocation.province}`
                  : `Localidad / ciudad: ${shippingLocation.locality || shippingLocation.city} · Provincia: ${shippingLocation.province}`}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Confirmá que es el destino del envío. Ciudad y provincia se completaron en el formulario.
              </p>
            </div>
          )}
          {shippingOptions.map((opt) => (
            <label key={opt.id} className="flex items-center justify-between border p-2 text-sm">
              <span>
                <input
                  type="radio"
                  className="mr-2"
                  checked={selectedShipping?.id === opt.id}
                  onChange={() => setSelectedShipping(opt)}
                />
                {opt.name} · {opt.eta}
              </span>
              <span>{coupon?.type === 'shipping' ? 'Gratis' : formatARS(opt.cost)}</span>
            </label>
          ))}
        </div>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4 border p-6">
        <h2 className="font-display text-3xl">Datos y pago</h2>
        <input
          required
          placeholder="Nombre y apellido"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          className="store-input"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={customer.email}
          onBlur={loadPoints}
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
          className="store-input"
        />
        <input
          required
          placeholder="Teléfono"
          value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          className="store-input"
        />
        <input
          required
          placeholder="Calle y número"
          value={address.street}
          onChange={(e) => setAddress({ ...address, street: e.target.value })}
          className="store-input"
        />
        <input
          placeholder="Piso / depto"
          value={address.floorAppart}
          onChange={(e) => setAddress({ ...address, floorAppart: e.target.value })}
          className="store-input"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            placeholder="Ciudad"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="store-input"
          />
          <input
            required
            placeholder="Provincia"
            value={address.province}
            onChange={(e) => setAddress({ ...address, province: e.target.value })}
            className="store-input"
          />
        </div>

        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Cupón"
            className="store-input"
          />
          <button type="button" onClick={applyCoupon} className="store-btn-outline">
            Aplicar
          </button>
        </div>
        {couponError && <p className="text-xs text-red-600">{couponError}</p>}
        {coupon && <p className="text-xs text-kap-green">Aplicado: {coupon.label}</p>}

        {availablePoints > 0 && (
          <label className="block text-xs">
            Puntos Club ({availablePoints} disponibles)
            <input
              type="number"
              min={0}
              max={availablePoints}
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
              className="store-input mt-1"
            />
          </label>
        )}

        <div className="space-y-2 text-sm">
          {commerce.mpEnabled && (
            <label className="flex gap-2">
              <input type="radio" checked={payMethod === 'mp'} onChange={() => setPayMethod('mp')} />
              {commerce.mpLabel}
            </label>
          )}
          {commerce.transferEnabled && (
            <label className="flex gap-2">
              <input type="radio" checked={payMethod === 'transfer'} onChange={() => setPayMethod('transfer')} />
              {commerce.transferLabel}
            </label>
          )}
          {commerce.transferEnabled && payMethod === 'transfer' && (commerce.transferCbu || commerce.transferAlias) && (
            <div className="whitespace-pre-line border bg-[#f4f7f4] px-3 py-2 text-xs text-neutral-700">
              {commerce.transferHolder ? `Titular: ${commerce.transferHolder}\n` : ''}
              {commerce.transferBank ? `Banco: ${commerce.transferBank}\n` : ''}
              {commerce.transferCbu ? `CBU/CVU: ${commerce.transferCbu}\n` : ''}
              {commerce.transferAlias ? `Alias: ${commerce.transferAlias}\n` : ''}
              {commerce.transferInstructions}
            </div>
          )}
          {!commerce.mpEnabled && !commerce.transferEnabled && (
            <p className="text-xs text-red-600">No hay medios de pago habilitados. Revisá Ajustes generales → Pagos.</p>
          )}
        </div>

        <div className="space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatARS(subtotal)}</span>
          </div>
          {payMethod === 'transfer' && (
            <div className="flex justify-between text-red-600">
              <span>{commerce.cashDiscountPercent}% OFF</span>
              <span>-{formatARS(subtotal - discountedSubtotal)}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between">
              <span>Cupón</span>
              <span>-{formatARS(couponDiscount)}</span>
            </div>
          )}
          {pointsValue > 0 && (
            <div className="flex justify-between">
              <span>Puntos</span>
              <span>-{formatARS(pointsValue)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{selectedShipping || coupon?.type === 'shipping' ? formatARS(shippingCost) : 'A calcular'}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatARS(grandTotal)}</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Sumás {Math.floor(grandTotal / 1000) * POINTS_PER_THOUSAND} puntos al aprobarse el pago.
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessingCheckout || empty || (!commerce.mpEnabled && !commerce.transferEnabled)}
          className="store-btn"
        >
          {isProcessingCheckout
            ? 'Procesando...'
            : payMethod === 'mp'
              ? 'Pagar con Mercado Pago'
              : 'Confirmar pedido'}
        </button>
      </form>
    </div>
  )
}
