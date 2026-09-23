'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatARS, type CatalogProduct, type ProductVariant } from '@/data/catalog'
import { sizesMatch, variantsForColor } from '@/lib/productMeta'
import { productSharePhrase } from '@/lib/productShare'
import { useCart } from '@/context/CartContext'
import { useCashDiscountRate, useCommerce } from '@/context/CommerceContext'
import CatalogImage from '@/components/store/CatalogImage'

function productPageUrl(product: CatalogProduct) {
  return `${window.location.origin}/productos/${product.slug}`
}

function productShareLinks(product: CatalogProduct) {
  const pageUrl = productPageUrl(product)
  const phrase = productSharePhrase(product.title)
  return {
    pageUrl,
    phrase,
    message: `${phrase}\n${pageUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(phrase)}`,
  }
}

function unitsLeft(variant: ProductVariant, reserved: { sku: string; stockSku?: string; quantity: number }[]) {
  const pool = variant.stockSku || variant.sku
  const used = reserved.reduce((acc, item) => ((item.stockSku || item.sku) === pool ? acc + item.quantity : acc), 0)
  return Math.max(0, variant.stock - used)
}

export default function ProductBuyBox({ product }: { product: CatalogProduct }) {
  const { addItem, items } = useCart()
  const gallery = (product.images?.length ? product.images : [product.image]).filter(Boolean)
  const [activeImage, setActiveImage] = useState(gallery[0] || '')
  const colors = useMemo(() => {
    const map = new Map<string, ProductVariant>()
    for (const variant of product.variants) {
      if (!variant.color || map.has(variant.color)) continue
      map.set(variant.color, variant)
    }
    return [...map.values()]
  }, [product.variants])
  const [color, setColor] = useState(colors[0]?.color ?? '')
  const [size, setSize] = useState('')
  const activeColor = color || colors[0]?.color || ''
  const sizes = useMemo(() => variantsForColor(product.variants, activeColor), [product.variants, activeColor])
  const availableSize = sizes.find((row) => row.size === size && row.stock > 0)?.size
  const activeSize = availableSize || sizes.find((row) => row.stock > 0)?.size || sizes[0]?.size || ''
  const variant = sizes.find((row) => row.size === activeSize) || sizes[0]
  const left = variant ? unitsLeft(variant, items) : 0
  const [shareLinks, setShareLinks] = useState<ReturnType<typeof productShareLinks> | null>(null)
  useEffect(() => {
    setShareLinks(productShareLinks(product))
  }, [product])
  const commerce = useCommerce()
  const cashRate = useCashDiscountRate()
  const cashPrice = Math.round(product.price * (1 - cashRate))

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <div>
        <CatalogImage src={activeImage} alt={product.title} className="aspect-[3/4] w-full rounded-md object-cover" />
        {gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {gallery.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(src)}
                className={`overflow-hidden rounded-md border ${activeImage === src ? 'border-black' : 'border-transparent'}`}
              >
                <CatalogImage src={src} alt="" className="aspect-square w-full object-cover" />
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
        {product.sizeGuide?.detalle ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-600">{product.sizeGuide.detalle}</p>
        ) : null}

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest">Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                title={c.color}
                aria-label={c.color}
                aria-pressed={activeColor === c.color}
                onClick={() => setColor(c.color)}
                className={`h-8 w-8 rounded-full border ${activeColor === c.color ? 'ring-2 ring-black ring-offset-2' : ''}`}
                style={{ backgroundColor: c.colorHex }}
              />
            ))}
          </div>
        </div>

        {sizes.length > 0 ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest">Talle</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const unavailable = s.stock <= 0
                const selected = s.size === activeSize
                return (
                  <button
                    key={`${s.stockSku}-${s.size}`}
                    type="button"
                    disabled={unavailable}
                    aria-pressed={selected}
                    onClick={() => setSize(s.size)}
                    className={`product-size-btn${selected ? ' is-selected' : ''}${unavailable ? ' is-unavailable' : ''}`}
                  >
                    {s.size}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-neutral-500">{left > 0 ? `${left} en stock` : 'Sin stock'}</p>

        {product.sizeGuide && product.sizeGuide.rows.length > 0 ? (
          <div className="product-size-guide mt-6">
            <p className="text-xs uppercase tracking-widest">Medidas por talle</p>
            <div className="product-size-guide__scroll mt-2">
              <table>
                <thead>
                  <tr>
                    <th>Talle</th>
                    {product.sizeGuide.columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.sizeGuide.rows.map((row) => (
                    <tr
                      key={row.talle}
                      className={sizesMatch(row.talle, activeSize) ? 'is-active' : undefined}
                    >
                      <th scope="row">{row.talle}</th>
                      {product.sizeGuide!.columns.map((col) => (
                        <td key={col.key}>{row.cells[col.key] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="store-btn mt-8"
          disabled={!variant || left <= 0}
          onClick={() => variant && left > 0 && addItem(product, variant)}
        >
          Agregar al carrito
        </button>
        <p className="mt-4">
          <Link href="/productos" className="text-xs uppercase tracking-nav underline">
            Volver al catálogo
          </Link>
        </p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest">Compartir</p>
          <div className="mt-3 flex items-center gap-4">
            <a
              href={shareLinks?.facebook || '#compartir'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en Facebook"
              className="product-share"
              onClick={(event) => {
                if (shareLinks) return
                event.preventDefault()
                window.open(productShareLinks(product).facebook, '_blank', 'noopener,noreferrer')
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14.5 8.5V6.8c0-.8.4-1.3 1.4-1.3H17V3h-2.2C12.1 3 11 4.5 11 6.7v1.8H9v2.8h2V21h3.4v-9.7h2.4l.4-2.8h-2.7z"
                />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en Instagram"
              className="product-share"
              onClick={async (event) => {
                event.preventDefault()
                const links = shareLinks || productShareLinks(product)
                try {
                  await navigator.clipboard.writeText(links.message)
                } catch {
                  /* Instagram se abre igual; el portapapeles puede estar bloqueado */
                }
                window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8a3.2 3.2 0 0 0 3.2-3.2V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.35 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
