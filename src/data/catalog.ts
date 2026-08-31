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

export const ANNOUNCEMENTS = [
  'Envíos a todo el país',
  '3 cuotas sin interés',
  '20% OFF pagando con transferencia',
  'Club Kaprichos: sumá puntos en cada compra',
]

export const MEGA_MENU_GROUPS = [
  { id: 'destacados', title: 'Destacados' },
  { id: 'remeras', title: 'Remeras y camisas' },
  { id: 'abrigo', title: 'Abrigo' },
  { id: 'total', title: 'Total look' },
] as const

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
  const sorted = [...categories].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  return MEGA_MENU_GROUPS.map((group) => ({
    title: group.title,
    links: [
      ...(group.id === 'destacados'
        ? [
            { label: 'Nuevos ingresos', href: '/productos?novedad=1' },
            { label: 'Rebajas', href: '/productos?oferta=1' },
          ]
        : []),
      ...sorted
        .filter((c) => c.menuGroup === group.id)
        .map((c) => ({ label: c.title, href: `/productos?categoria=${c.slug}` })),
    ],
  })).filter((col) => col.links.length > 0)
}

export function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}
