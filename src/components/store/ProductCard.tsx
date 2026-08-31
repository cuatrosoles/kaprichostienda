import Link from 'next/link'
import { CASH_DISCOUNT, formatARS, type CatalogProduct } from '@/data/catalog'

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const cashPrice = Math.round(product.price * (1 - CASH_DISCOUNT))

  return (
    <article className="group">
      <Link href={`/productos/${product.slug}`} className="block overflow-hidden rounded-md">
        <img
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
        <p className="text-xs font-semibold text-red-600">20% OFF {formatARS(cashPrice)} efectivo / transferencia</p>
      </div>
    </article>
  )
}
