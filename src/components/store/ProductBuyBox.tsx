'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CASH_DISCOUNT, formatARS, type CatalogProduct } from '@/data/catalog'
import { useCart } from '@/context/CartContext'

export default function ProductBuyBox({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart()
  const colors = useMemo(
    () => Array.from(new Map(product.variants.map((v) => [v.color, v])).values()),
    [product],
  )
  const [color, setColor] = useState(colors[0]?.color ?? '')
  const sizes = product.variants.filter((v) => v.color === (color || colors[0]?.color))
  const [size, setSize] = useState(sizes[0]?.size ?? '')
  const variant =
    product.variants.find((v) => v.color === (color || colors[0]?.color) && v.size === (size || sizes[0]?.size)) ||
    product.variants[0]
  const cashPrice = Math.round(product.price * (1 - CASH_DISCOUNT))

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <img src={product.image} alt={product.title} className="w-full rounded-md object-cover" />
      <div>
        <p className="text-[11px] uppercase tracking-nav text-neutral-500">Inicio / Productos / {product.title}</p>
        <h1 className="mt-3 font-display text-4xl">{product.title}</h1>
        <p className="mt-3 text-xl">{formatARS(product.price)}</p>
        <p className="mt-1 text-sm font-semibold text-red-600">
          20% OFF {formatARS(cashPrice)} efectivo o transferencia
        </p>
        <p className="mt-6 text-sm leading-6 text-neutral-600">{product.description}</p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest">Color</p>
          <div className="mt-2 flex gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                title={c.color}
                onClick={() => {
                  setColor(c.color)
                  const next = product.variants.find((v) => v.color === c.color)
                  if (next) setSize(next.size)
                }}
                className={`h-8 w-8 rounded-full border ${ (color || colors[0]?.color) === c.color ? 'ring-2 ring-black ring-offset-2' : ''}`}
                style={{ backgroundColor: c.colorHex }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest">Talle</p>
          <div className="mt-2 flex gap-2">
            {sizes.map((s) => (
              <button
                key={s.sku}
                type="button"
                onClick={() => setSize(s.size)}
                className={`min-w-10 border px-3 py-2 text-sm ${ (size || sizes[0]?.size) === s.size ? 'bg-black text-white' : ''}`}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">Stock: {variant?.stock ?? 0} · SKU {variant?.sku}</p>

        <button
          type="button"
          className="store-btn mt-8"
          disabled={!variant || variant.stock <= 0}
          onClick={() => variant && addItem(product, variant)}
        >
          Agregar al carrito
        </button>
        <p className="mt-4">
          <Link href="/productos" className="text-xs uppercase tracking-nav underline">
            Volver al catálogo
          </Link>
        </p>
      </div>
    </div>
  )
}
