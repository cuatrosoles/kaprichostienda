'use client'

import React, { useState } from 'react'

type CartItem = {
  id: string
  title: string
  price: number
  quantity: number
  weight?: number
}

type ShippingOption = {
  id: string
  name: string
  cost: number
  eta: string
}

export default function CarritoView({ cartItemsData }: { cartItemsData: CartItem[] }) {
  const [cart] = useState<CartItem[]>(cartItemsData)
  const [zipCode, setZipCode] = useState('')
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)

  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [address, setAddress] = useState({ street: '', floorAppart: '', city: '', province: '' })

  const productsTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalWeight = cart.reduce((acc, item) => acc + (item.weight || 500) * item.quantity, 0)
  const grandTotal = productsTotal + (selectedShipping ? selectedShipping.cost : 0)

  const handleCalculateShipping = async () => {
    if (!zipCode) return
    setLoadingShipping(true)
    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, totalWeight }),
      })
      const data = await res.json()
      if (data.options) {
        setShippingOptions(data.options)
        setSelectedShipping(data.options[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingShipping(false)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipping) return alert('Por favor calcula y selecciona una opción de envío')

    setIsProcessingCheckout(true)
    try {
      const checkoutPayload = {
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
        customer,
        shippingAddress: { ...address, zipCode },
        shippingCost: selectedShipping.cost,
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      })

      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || 'Fallo de procesamiento')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      alert(`Error en Checkout: ${message}`)
      setIsProcessingCheckout(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 p-4 font-sans md:grid-cols-2">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Tu Carrito de Compras</h2>
        <div className="divide-y rounded-lg border bg-white p-4 shadow-sm">
          {cart.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">Tu carrito está vacío.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{item.title}</h4>
                  <p className="text-sm text-gray-500">
                    Cantidad: {item.quantity} x ${item.price.toLocaleString('es-AR')}
                  </p>
                </div>
                <span className="font-medium text-gray-900">
                  ${(item.price * item.quantity).toLocaleString('es-AR')}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
          <h3 className="text-lg font-bold text-gray-800">Calcular Envío (Argentina)</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código Postal (ej: 1425)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="flex-1 rounded border px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleCalculateShipping}
              disabled={loadingShipping}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loadingShipping ? 'Calculando...' : 'Calcular'}
            </button>
          </div>

          {shippingOptions.length > 0 && (
            <div className="mt-3 space-y-2">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center justify-between rounded border bg-white p-2 text-black hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping?.id === opt.id}
                      onChange={() => setSelectedShipping(opt)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{opt.name}</p>
                      <p className="text-xs text-gray-500">Plazo: {opt.eta}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    ${opt.cost.toLocaleString('es-AR')}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleCheckout} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Datos de Facturación y Entrega
        </h2>

        <div className="space-y-3">
          <input
            required
            type="text"
            placeholder="Nombre y Apellido completo"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            className="w-full rounded border px-3 py-2 text-sm text-black"
          />
          <input
            required
            type="email"
            placeholder="Correo Electrónico"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            className="w-full rounded border px-3 py-2 text-sm text-black"
          />
          <input
            required
            type="tel"
            placeholder="Teléfono celular (con código de área)"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            className="w-full rounded border px-3 py-2 text-sm text-black"
          />
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Dirección Física
          </h4>
          <input
            required
            type="text"
            placeholder="Calle, Número, Localidad"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            className="w-full rounded border px-3 py-2 text-sm text-black"
          />
          <input
            type="text"
            placeholder="Piso / Depto / Oficina (Opcional)"
            value={address.floorAppart}
            onChange={(e) => setAddress({ ...address, floorAppart: e.target.value })}
            className="w-full rounded border px-3 py-2 text-sm text-black"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              type="text"
              placeholder="Ciudad"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm text-black"
            />
            <input
              required
              type="text"
              placeholder="Provincia"
              value={address.province}
              onChange={(e) => setAddress({ ...address, province: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm text-black"
            />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal Productos:</span>
            <span>${productsTotal.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Costo de Envío:</span>
            <span>
              {selectedShipping ? `$${selectedShipping.cost.toLocaleString('es-AR')}` : 'A calcular'}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold text-gray-900">
            <span>Total General:</span>
            <span>${grandTotal.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessingCheckout || cart.length === 0}
          className="w-full rounded-lg bg-emerald-600 py-3 text-base font-bold text-white shadow hover:bg-emerald-700 transition disabled:bg-gray-400"
        >
          {isProcessingCheckout ? 'Procesando Transacción...' : 'Pagar con Mercado Pago'}
        </button>
      </form>
    </div>
  )
}
