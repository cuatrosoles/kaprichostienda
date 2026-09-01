import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import type { Category, Coupon, Media, Product } from '@/payload-types'
import type { CatalogCategory, CatalogCoupon, CatalogProduct, ProductVariant } from '@/data/catalog'
import { SEED_CATEGORIES } from '@/data/seed-catalog'

function mediaUrl(file: number | Media | null | undefined): string | null {
  if (!file || typeof file === 'number') return null
  return file.sizes?.card?.url || file.url || null
}

export function mapCategory(doc: Category): CatalogCategory {
  return {
    slug: doc.slug,
    title: doc.title,
    image: doc.imageUrl || '/catalog/prod-remera.jpg',
    description: doc.description || undefined,
    menuGroup: doc.menuGroup || undefined,
    sort: doc.sort ?? 0,
    showOnHome: doc.showOnHome !== false,
  }
}

export function mapProduct(doc: Product): CatalogProduct {
  const category =
    typeof doc.category === 'object' && doc.category ? doc.category.slug : ''
  const fromUploads = (doc.images || [])
    .map((img) => mediaUrl(img))
    .filter((url): url is string => Boolean(url))
  const image = doc.imageUrl || fromUploads[0] || '/catalog/prod-remera.jpg'
  const variants: ProductVariant[] = (doc.variants || []).map((v) => ({
    sku: v.sku,
    size: v.size,
    color: v.color,
    colorHex: v.colorHex || '#111111',
    stock: Number(v.stock ?? 0),
  }))

  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    price: Number(doc.price),
    category,
    image,
    images: fromUploads.length ? fromUploads : [image],
    isNew: Boolean(doc.isNew),
    onSale: Boolean(doc.onSale),
    featured: Boolean(doc.featured),
    weight: Number(doc.weight || 400),
    description: doc.description || '',
    variants,
  }
}

export function mapCoupon(doc: Coupon): CatalogCoupon {
  return {
    code: doc.code,
    type: doc.type,
    value: Number(doc.value),
    label: doc.label || doc.code,
  }
}

async function payloadClient() {
  return getPayload({ config })
}

export async function getStoreCategories(): Promise<CatalogCategory[]> {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'categories',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    const mapped = result.docs.map(mapCategory)
    if (mapped.length) {
      return mapped.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    }
  } catch (error) {
    console.error('No se pudieron leer categorías de Payload:', error)
  }
  return SEED_CATEGORIES.map((c) => ({
    slug: c.slug,
    title: c.title,
    image: c.imageUrl,
    menuGroup: c.menuGroup,
    sort: c.sort,
    showOnHome: true,
  }))
}

export async function getStoreProducts(params?: {
  categoria?: string
  novedad?: string
  oferta?: string
  q?: string
  featured?: boolean
  isNew?: boolean
}): Promise<CatalogProduct[]> {
  try {
    const payload = await payloadClient()
    const and: Where[] = [{ status: { equals: 'published' } }]

    if (params?.categoria) {
      const cat = await payload.find({
        collection: 'categories',
        where: { slug: { equals: params.categoria } },
        limit: 1,
      })
      if (!cat.docs[0]) return []
      and.push({ category: { equals: cat.docs[0].id } })
    }
    if (params?.novedad || params?.isNew) and.push({ isNew: { equals: true } })
    if (params?.oferta) and.push({ onSale: { equals: true } })
    if (params?.featured) and.push({ featured: { equals: true } })
    if (params?.q) {
      and.push({
        or: [{ title: { like: params.q } }, { description: { like: params.q } }],
      })
    }

    const result = await payload.find({
      collection: 'products',
      where: { and },
      depth: 2,
      limit: 100,
      sort: '-createdAt',
    })
    return result.docs.map(mapProduct)
  } catch (error) {
    console.error('No se pudieron leer productos de Payload:', error)
    return []
  }
}

export async function getStoreProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'products',
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
      },
      depth: 2,
      limit: 1,
    })
    return result.docs[0] ? mapProduct(result.docs[0]) : null
  } catch (error) {
    console.error('No se pudo leer el producto:', error)
    return null
  }
}

export async function findStoreProductDoc(idOrSlug: string) {
  const payload = await payloadClient()
  if (/^\d+$/.test(idOrSlug)) {
    try {
      return await payload.findByID({
        collection: 'products',
        id: Number(idOrSlug),
        depth: 1,
        overrideAccess: true,
      })
    } catch {
      /* seguir por slug */
    }
  }
  const bySlug = await payload.find({
    collection: 'products',
    where: { slug: { equals: idOrSlug } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  return bySlug.docs[0] ?? null
}

export async function getStoreCoupon(code: string): Promise<CatalogCoupon | null> {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'coupons',
      where: {
        and: [{ code: { equals: code.toUpperCase() } }, { active: { equals: true } }],
      },
      limit: 1,
    })
    return result.docs[0] ? mapCoupon(result.docs[0]) : null
  } catch (error) {
    console.error('No se pudo leer el cupón:', error)
    return null
  }
}
