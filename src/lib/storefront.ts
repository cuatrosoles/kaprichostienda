import type { Where } from 'payload'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import type { Category, Coupon, Media, Product } from '@/payload-types'
import type { CatalogCategory, CatalogCoupon, CatalogProduct, HeroView, ProductVariant } from '@/data/catalog'
import { DEFAULT_HERO } from '@/data/catalog'
import { SEED_CATEGORIES } from '@/data/seed-catalog'
import { withPayload } from '@/lib/payload'

function mediaUrl(file: number | Media | null | undefined): string | null {
  if (!file || typeof file === 'number') return null
  return file.sizes?.card?.url || file.url || null
}

function categoryParentSlug(doc: Category): string | undefined {
  if (!doc.parent) return undefined
  if (typeof doc.parent === 'object') return doc.parent.slug || undefined
  return undefined
}

export function mapCategory(doc: Category): CatalogCategory {
  return {
    slug: doc.slug,
    title: doc.title,
    image: doc.imageUrl || '/catalog/prod-remera.jpg',
    description: doc.description || undefined,
    parentSlug: categoryParentSlug(doc),
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

export const getStoreCategories = cache(async (): Promise<CatalogCategory[]> => {
  return loadStoreCategories()
})

const loadStoreCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    try {
      return await withPayload(async (payload) => {
        const result = await payload.find({
          collection: 'categories',
          limit: 200,
          depth: 1,
          pagination: false,
          overrideAccess: true,
        })
        const mapped = result.docs.map(mapCategory)
        if (mapped.length) {
          return mapped.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        }
        return seedCategories()
      })
    } catch (error) {
      console.error('No se pudieron leer categorías de Payload:', error)
      return seedCategories()
    }
  },
  ['store-categories'],
  { revalidate: 60 },
)

function seedCategories(): CatalogCategory[] {
  return SEED_CATEGORIES.map((c) => ({
    slug: c.slug,
    title: c.title,
    image: c.imageUrl,
    parentSlug: c.parent,
    sort: c.sort,
    showOnHome: c.showOnHome !== false && !c.parent,
  }))
}

async function loadStoreProducts(params?: {
  categoria?: string
  novedad?: string
  oferta?: string
  q?: string
  featured?: boolean
  isNew?: boolean
}): Promise<CatalogProduct[]> {
  try {
    return await withPayload(async (payload) => {
      const and: Where[] = [{ status: { equals: 'published' } }]

      if (params?.categoria) {
        const cat = await payload.find({
          collection: 'categories',
          where: { slug: { equals: params.categoria } },
          limit: 1,
          pagination: false,
          overrideAccess: true,
        })
        if (!cat.docs[0]) return []
        const children = await payload.find({
          collection: 'categories',
          where: { parent: { equals: cat.docs[0].id } },
          limit: 100,
          pagination: false,
          overrideAccess: true,
        })
        const ids = [cat.docs[0].id, ...children.docs.map((doc) => doc.id)]
        and.push({ category: { in: ids } })
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
        depth: 1,
        limit: 100,
        pagination: false,
        overrideAccess: true,
        sort: '-createdAt',
      })
      return result.docs.map(mapProduct)
    })
  } catch (error) {
    console.error('No se pudieron leer productos de Payload:', error)
    return []
  }
}

export async function getStoreProducts(params?: {
  categoria?: string
  novedad?: string
  oferta?: string
  q?: string
  featured?: boolean
  isNew?: boolean
}): Promise<CatalogProduct[]> {
  const key = JSON.stringify({
    categoria: params?.categoria || '',
    novedad: params?.novedad || '',
    oferta: params?.oferta || '',
    q: params?.q || '',
    featured: Boolean(params?.featured),
    isNew: Boolean(params?.isNew),
  })
  return cachedStoreProducts(key)
}

const cachedStoreProducts = unstable_cache(
  async (key: string) => {
    const params = JSON.parse(key) as {
      categoria: string
      novedad: string
      oferta: string
      q: string
      featured: boolean
      isNew: boolean
    }
    return loadStoreProducts({
      categoria: params.categoria || undefined,
      novedad: params.novedad || undefined,
      oferta: params.oferta || undefined,
      q: params.q || undefined,
      featured: params.featured || undefined,
      isNew: params.isNew || undefined,
    })
  },
  ['store-products'],
  { revalidate: 60 },
)

export async function getStoreProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    return await withPayload(async (payload) => {
      const result = await payload.find({
        collection: 'products',
        where: {
          and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
        },
        depth: 1,
        limit: 1,
        pagination: false,
        overrideAccess: true,
      })
      return result.docs[0] ? mapProduct(result.docs[0]) : null
    })
  } catch (error) {
    console.error('No se pudo leer el producto:', error)
    return null
  }
}

export async function findStoreProductDoc(idOrSlug: string) {
  return withPayload(async (payload) => {
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
      pagination: false,
      overrideAccess: true,
    })
    return bySlug.docs[0] ?? null
  })
}

export async function getStoreCoupon(code: string): Promise<CatalogCoupon | null> {
  try {
    return await withPayload(async (payload) => {
      const result = await payload.find({
        collection: 'coupons',
        where: {
          and: [{ code: { equals: code.toUpperCase() } }, { active: { equals: true } }],
        },
        limit: 1,
        pagination: false,
        overrideAccess: true,
      })
      return result.docs[0] ? mapCoupon(result.docs[0]) : null
    })
  } catch (error) {
    console.error('No se pudo leer el cupón:', error)
    return null
  }
}

const OBJECT_POSITION: Record<string, string> = {
  center_top: 'center top',
  center: 'center',
  center_bottom: 'center bottom',
  left: 'left',
  right: 'right',
}

function heroImageUrl(image: number | Media | null | undefined, fallback?: string | null) {
  if (image && typeof image === 'object') return image.url || fallback || null
  return fallback || null
}

export const getHomeHero = cache(async (): Promise<HeroView> => loadHomeHero())

const loadHomeHero = unstable_cache(
  async (): Promise<HeroView> => {
    try {
      return await withPayload(async (payload) => {
        const doc = await payload.findGlobal({
          slug: 'home-hero',
          depth: 1,
          overrideAccess: true,
        })
        const slides = (doc.slides || [])
          .filter((slide) => slide.active !== false)
          .map((slide) => {
            const image = heroImageUrl(slide.image, slide.imageUrl) || ''
            return {
              image,
              alt: slide.alt || slide.title || 'Kaprichos',
              eyebrow: slide.eyebrow || undefined,
              title: slide.title || undefined,
              badges: (slide.badges || []).map((b) => b.text).filter(Boolean),
              ctaLabel: slide.ctaLabel || undefined,
              ctaHref: slide.ctaHref || undefined,
              objectPosition: OBJECT_POSITION[slide.objectPosition || 'center_top'] || 'center top',
            }
          })
          .filter((slide) => Boolean(slide.image))

        if (!slides.length) return DEFAULT_HERO

        const transition = doc.transition === 'slide' || doc.transition === 'zoom' ? doc.transition : 'fade'
        return {
          slides,
          transition,
          intervalMs: Math.max(2000, Number(doc.intervalSeconds || 6) * 1000),
          durationMs: Math.min(2500, Math.max(200, Number(doc.durationMs || 800))),
          autoplay: doc.autoplay !== false,
          showArrows: doc.showArrows !== false,
          showDots: doc.showDots !== false,
        }
      })
    } catch (error) {
      console.error('No se pudo leer el hero:', error)
      return DEFAULT_HERO
    }
  },
  ['store-home-hero'],
  { revalidate: 60 },
)
