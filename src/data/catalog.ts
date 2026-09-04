export type ProductVariant = {
  sku: string
  size: string
  color: string
  colorHex: string
  stock: number
}

export type CatalogProduct = {
  id: string
  slug: string
  sku?: string
  title: string
  price: number
  category: string
  image: string
  images: string[]
  isNew?: boolean
  onSale?: boolean
  featured?: boolean
  weight: number
  description: string
  variants: ProductVariant[]
}

export type CatalogCategory = {
  slug: string
  title: string
  image: string
  description?: string
  parentSlug?: string
  menuGroup?: string
  sort?: number
  showOnHome?: boolean
}

export type CatalogCoupon = {
  code: string
  type: 'percent' | 'shipping'
  value: number
  label: string
}

export type HeroSlideView = {
  image: string
  alt: string
  eyebrow?: string
  title?: string
  badges: string[]
  ctaLabel?: string
  ctaHref?: string
  objectPosition: string
}

export type HeroView = {
  slides: HeroSlideView[]
  transition: 'fade' | 'slide' | 'zoom'
  intervalMs: number
  durationMs: number
  autoplay: boolean
  showArrows: boolean
  showDots: boolean
}

export const DEFAULT_HERO: HeroView = {
  slides: [
    {
      image: '/catalog/hero-temporada.jpg',
      alt: 'Nueva temporada Kaprichos',
      eyebrow: 'Nueva',
      title: 'Temporada',
      badges: ['3 cuotas sin interés', '20% OFF efectivo o transferencia'],
      objectPosition: 'center top',
    },
  ],
  transition: 'fade',
  intervalMs: 6000,
  durationMs: 800,
  autoplay: true,
  showArrows: true,
  showDots: true,
}

export const ANNOUNCEMENTS = [
  'Envíos a todo el país',
  '3 cuotas sin interés',
  '20% OFF pagando con transferencia',
  'Club Kaprichos: sumá puntos en cada compra',
]

export function topLevelCategories(categories: CatalogCategory[]) {
  return categories.filter((c) => !c.parentSlug).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export function childCategories(categories: CatalogCategory[], parentSlug: string) {
  return categories
    .filter((c) => c.parentSlug === parentSlug)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export const CASH_DISCOUNT = 0.2
export const MIN_PURCHASE = 50000
export const POINTS_PER_THOUSAND = 1
export const POINT_VALUE_ARS = 10

export function productStock(product: CatalogProduct) {
  return product.variants.reduce((acc, v) => acc + v.stock, 0)
}

export function filterProducts(
  products: CatalogProduct[],
  params: {
    categoria?: string
    novedad?: string
    oferta?: string
    q?: string
  },
) {
  return products.filter((p) => {
    if (params.categoria && p.category !== params.categoria) return false
    if (params.novedad && !p.isNew) return false
    if (params.oferta && !p.onSale) return false
    if (params.q) {
      const q = params.q.toLowerCase()
      return p.title.toLowerCase().includes(q) || p.category.includes(q)
    }
    return true
  })
}

export function buildMegaMenu(categories: CatalogCategory[]) {
  return topLevelCategories(categories).map((parent) => ({
    title: parent.title,
    href: `/productos?categoria=${parent.slug}`,
    links: childCategories(categories, parent.slug).map((c) => ({
      label: c.title,
      href: `/productos?categoria=${c.slug}`,
    })),
  }))
}

export function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}
