import Link from 'next/link'
import { getStoreProductBySlug } from '@/lib/storefront'
import ProductBuyBox from '@/components/store/ProductBuyBox'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getStoreProductBySlug(slug)

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p>Producto no encontrado.</p>
        <Link href="/productos" className="mt-4 inline-block underline">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  return <ProductBuyBox product={product} />
}
