'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatARS, type CatalogProduct } from '@/data/catalog'
import { useCart } from '@/context/CartContext'
import { useCashDiscountRate, useCommerce } from '@/context/CommerceContext'

export default function ProductBuyBox({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart()
  const gallery = product.images?.length ? product.images : [product.image]
  const [activeImage, setActiveImage] = useState(gallery[0] || product.image)
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
  const commerce = useCommerce()
  const cashRate = useCashDiscountRate()
  const cashPrice = Math.round(product.price * (1 - cashRate))

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <div>
        <img src={activeImage} alt={product.title} className="w-full rounded-md object-cover" />
        {gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {gallery.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(src)}
                className={`overflow-hidden rounded-md border ${activeImage === src ? 'border-black' : 'border-transparent'}`}
              >
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-nav text-neutral-500">Inicio / Productos / {product.title}</p>
        <h1 className="mt-3 font-display text-4xl">{product.title}</h1>
        {product.sku && <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">SKU {product.sku}</p>}
        <p className="mt-3 text-xl">{formatARS(product.price)}</p>
        {commerce.transferEnabled ? (
          <p className="mt-1 text-sm font-semibold text-red-600">
            {commerce.cashDiscountPercent}% OFF {formatARS(cashPrice)} efectivo o transferencia
          </p>
        ) : null}
        <p className="mt-6 whitespace-pre-line text-sm leading-6 text-neutral-600">{product.description}</p>

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
                key={`${s.color}-${s.size}`}
                type="button"
                onClick={() => setSize(s.size)}
                className={`min-w-10 border px-3 py-2 text-sm ${ (size || sizes[0]?.size) === s.size ? 'bg-black text-white' : ''}`}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          Stock: {variant?.stock ?? 0}
          {variant?.sku ? ` · Variante ${variant.sku}` : ''}
        </p>

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
