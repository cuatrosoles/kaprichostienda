'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { formatARS } from '@/data/catalog'
import CatalogImage from '@/components/store/CatalogImage'

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotal, count } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Cerrar carrito" onClick={closeCart} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-nav">Carrito de compras</h2>
          <button type="button" onClick={closeCart} className="text-xs uppercase tracking-widest">
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {count === 0 ? (
            <div className="rounded border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              El carrito de compras está vacío
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.sku} className="flex gap-3">
                  <CatalogImage src={item.image} alt={item.title} className="h-24 w-16 shrink-0 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-neutral-500">
                      {item.color} / {item.size}
                    </p>
                    <p className="mt-1 text-sm">{formatARS(item.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(item.sku, item.quantity - 1)} className="h-7 w-7 border">
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.sku, item.quantity + 1)} className="h-7 w-7 border">
                        +
                      </button>
                      <button type="button" onClick={() => removeItem(item.sku)} className="ml-auto text-xs underline">
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-5 py-4">
          <div className="mb-3 flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">{formatARS(subtotal)}</span>
          </div>
          <Link href="/carrito" onClick={closeCart} className="store-btn">
            Finalizar compra
          </Link>
        </div>
      </aside>
    </div>
  )
}
