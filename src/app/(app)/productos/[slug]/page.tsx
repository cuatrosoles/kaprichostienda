import type { Metadata } from 'next'
import Link from 'next/link'
import { getStoreProductBySlug } from '@/lib/storefront'
import { getStoreSettings } from '@/lib/auth'
import { storefrontUrl } from '@/lib/storeCommerce'
import { productSharePhrase } from '@/lib/productShare'
import ProductBuyBox from '@/components/store/ProductBuyBox'

function absoluteAsset(src: string, origin: string) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  return `${origin}${src.startsWith('/') ? src : `/${src}`}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getStoreProductBySlug(slug)
  if (!product) return { title: 'Producto' }
  const settings = await getStoreSettings().catch(() => null)
  const site = storefrontUrl(settings)
  const pageUrl = `${site}/productos/${product.slug}`
  const description = product.description.replace(/\s+/g, ' ').trim().slice(0, 180) || product.title
  const shareText = productSharePhrase(product.title)
  const image = absoluteAsset(product.image, site)
  return {
    title: `${product.title} | Kaprichos`,
    description,
    openGraph: {
      title: product.title,
      description: shareText,
      url: pageUrl,
      type: 'website',
      images: image ? [{ url: image, alt: product.title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

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
