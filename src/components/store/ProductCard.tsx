'use client'

import Link from 'next/link'
import { formatARS, type CatalogProduct } from '@/data/catalog'
import { useCashDiscountRate, useCommerce } from '@/context/CommerceContext'
import CatalogImage from '@/components/store/CatalogImage'

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const commerce = useCommerce()
  const cashRate = useCashDiscountRate()
  const cashPrice = Math.round(product.price * (1 - cashRate))

  return (
    <article className="group">
      <Link href={`/productos/${product.slug}`} className="block overflow-hidden rounded-md">
        <CatalogImage
          src={product.image}
          alt={product.title}
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="mt-3 text-center">
        <Link href={`/productos/${product.slug}`} className="text-sm font-medium">
          {product.title}
        </Link>
        <p className="mt-1 text-sm">{formatARS(product.price)}</p>
        {commerce.transferEnabled ? (
          <p className="text-xs font-semibold text-red-600">
            {commerce.cashDiscountPercent}% OFF {formatARS(cashPrice)} efectivo / transferencia
          </p>
        ) : null}
      </div>
    </article>
  )
}
