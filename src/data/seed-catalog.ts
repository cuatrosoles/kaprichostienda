export type SeedVariant = {
  sku: string
  size: string
  color: string
  colorHex: string
  stock: number
}

export type SeedCategory = {
  slug: string
  title: string
  imageUrl: string
  sort: number
  parent?: string
  showOnHome?: boolean
}

export type SeedProduct = {
  slug: string
  title: string
  sku: string
  price: number
  category: string
  imageUrl: string
  isNew?: boolean
  onSale?: boolean
  featured?: boolean
  weight: number
  description: string
  variants: SeedVariant[]
}

export type SeedCoupon = {
  code: string
  type: 'percent' | 'shipping'
  value: number
  label: string
  active: boolean
}

const SIZES = ['S', 'M', 'L', 'XL'] as const

function variants(
  prefix: string,
  colors: Array<{ color: string; hex: string }>,
  stock = 12,
): SeedVariant[] {
  return colors.flatMap((c) =>
    SIZES.map((size) => ({
      sku: `${prefix}-${c.color.slice(0, 3).toUpperCase()}-${size}`,
      size,
      color: c.color,
      colorHex: c.hex,
      stock,
    })),
  )
}

const IMG = {
  mujer: '/catalog/prod-remera.jpg',
  hombre: '/catalog/prod-buzo.jpg',
  bebes: '/catalog/prod-musculosa.jpg',
  ofertas: '/catalog/prod-sastreria.jpg',
  ninos: '/catalog/prod-conjunto.jpg',
  ninas: '/catalog/prod-sweater.jpg',
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: 'mujer', title: 'Mujer', imageUrl: IMG.mujer, sort: 10, showOnHome: true },
  { slug: 'hombre', title: 'Hombre', imageUrl: IMG.hombre, sort: 20, showOnHome: true },
  { slug: 'bebes', title: 'Bebés', imageUrl: IMG.bebes, sort: 30, showOnHome: true },
  { slug: 'ofertas', title: 'Ofertas', imageUrl: IMG.ofertas, sort: 40, showOnHome: true },
  { slug: 'ninos', title: 'Niños', imageUrl: IMG.ninos, sort: 50, showOnHome: true },
  { slug: 'ninas', title: 'Niñas', imageUrl: IMG.ninas, sort: 60, showOnHome: true },

  { slug: 'mujer-pantalones', title: 'Pantalones', imageUrl: IMG.mujer, parent: 'mujer', sort: 11, showOnHome: false },
  { slug: 'mujer-camisas-blusas', title: 'Camisas y blusas', imageUrl: '/catalog/prod-camisa.jpg', parent: 'mujer', sort: 12, showOnHome: false },
  { slug: 'mujer-remeras-manga-larga', title: 'Remeras manga larga', imageUrl: IMG.mujer, parent: 'mujer', sort: 13, showOnHome: false },
  { slug: 'mujer-remeras-manga-corta', title: 'Remeras manga corta', imageUrl: IMG.mujer, parent: 'mujer', sort: 14, showOnHome: false },
  { slug: 'mujer-tejidos', title: 'Tejidos', imageUrl: '/catalog/prod-sweater.jpg', parent: 'mujer', sort: 15, showOnHome: false },
  { slug: 'mujer-tapados', title: 'Tapados', imageUrl: '/catalog/prod-piloto.jpg', parent: 'mujer', sort: 16, showOnHome: false },
  { slug: 'mujer-chalecos', title: 'Chalecos', imageUrl: '/catalog/prod-campera.jpg', parent: 'mujer', sort: 17, showOnHome: false },

  { slug: 'hombre-remeras-manga-larga', title: 'Remeras manga larga', imageUrl: IMG.hombre, parent: 'hombre', sort: 21, showOnHome: false },
  { slug: 'hombre-remeras-manga-corta', title: 'Remeras manga corta', imageUrl: IMG.hombre, parent: 'hombre', sort: 22, showOnHome: false },
  { slug: 'hombre-tejidos', title: 'Tejidos', imageUrl: '/catalog/prod-sweater.jpg', parent: 'hombre', sort: 23, showOnHome: false },
  { slug: 'hombre-buzos', title: 'Buzos', imageUrl: '/catalog/prod-buzo.jpg', parent: 'hombre', sort: 24, showOnHome: false },
  { slug: 'hombre-camperas', title: 'Camperas', imageUrl: '/catalog/prod-campera.jpg', parent: 'hombre', sort: 25, showOnHome: false },
  { slug: 'hombre-camperones', title: 'Camperones', imageUrl: '/catalog/prod-piloto.jpg', parent: 'hombre', sort: 26, showOnHome: false },

  { slug: 'bebes-enteritos', title: 'Enteritos', imageUrl: IMG.bebes, parent: 'bebes', sort: 31, showOnHome: false },
  { slug: 'bebes-conjuntos', title: 'Conjuntos', imageUrl: '/catalog/prod-conjunto.jpg', parent: 'bebes', sort: 32, showOnHome: false },
  { slug: 'bebes-bodys', title: 'Bodys', imageUrl: IMG.bebes, parent: 'bebes', sort: 33, showOnHome: false },
  { slug: 'bebes-remeras-manga-larga', title: 'Remeras manga larga', imageUrl: IMG.bebes, parent: 'bebes', sort: 34, showOnHome: false },
  { slug: 'bebes-pantalones', title: 'Pantalones', imageUrl: IMG.bebes, parent: 'bebes', sort: 35, showOnHome: false },
  { slug: 'bebes-batitas', title: 'Batitas', imageUrl: IMG.bebes, parent: 'bebes', sort: 36, showOnHome: false },
  { slug: 'bebes-medio-ositos', title: 'Medio ositos', imageUrl: IMG.bebes, parent: 'bebes', sort: 37, showOnHome: false },

  { slug: 'ofertas-mujer', title: 'Mujer', imageUrl: IMG.mujer, parent: 'ofertas', sort: 41, showOnHome: false },
  { slug: 'ofertas-hombre', title: 'Hombre', imageUrl: IMG.hombre, parent: 'ofertas', sort: 42, showOnHome: false },
  { slug: 'ofertas-ninos', title: 'Niños', imageUrl: IMG.ninos, parent: 'ofertas', sort: 43, showOnHome: false },
  { slug: 'ofertas-bebes', title: 'Bebés', imageUrl: IMG.bebes, parent: 'ofertas', sort: 44, showOnHome: false },
  { slug: 'ofertas-calzado', title: 'Calzado', imageUrl: IMG.ofertas, parent: 'ofertas', sort: 45, showOnHome: false },

  { slug: 'ninos-pantalones', title: 'Pantalones', imageUrl: IMG.ninos, parent: 'ninos', sort: 51, showOnHome: false },
  { slug: 'ninos-buzos', title: 'Buzos', imageUrl: IMG.ninos, parent: 'ninos', sort: 52, showOnHome: false },
  { slug: 'ninos-camperas', title: 'Camperas', imageUrl: IMG.ninos, parent: 'ninos', sort: 53, showOnHome: false },
  { slug: 'ninos-tejidos', title: 'Tejidos', imageUrl: IMG.ninos, parent: 'ninos', sort: 54, showOnHome: false },
  { slug: 'ninos-camperones', title: 'Camperones', imageUrl: IMG.ninos, parent: 'ninos', sort: 55, showOnHome: false },

  { slug: 'ninas-pantalones', title: 'Pantalones', imageUrl: IMG.ninas, parent: 'ninas', sort: 61, showOnHome: false },
  { slug: 'ninas-buzos', title: 'Buzos', imageUrl: IMG.ninas, parent: 'ninas', sort: 62, showOnHome: false },
  { slug: 'ninas-camperas', title: 'Camperas', imageUrl: IMG.ninas, parent: 'ninas', sort: 63, showOnHome: false },
  { slug: 'ninas-tejidos', title: 'Tejidos', imageUrl: IMG.ninas, parent: 'ninas', sort: 64, showOnHome: false },
  { slug: 'ninas-camperones', title: 'Camperones', imageUrl: IMG.ninas, parent: 'ninas', sort: 65, showOnHome: false },
]

/** Slugs viejos del catálogo de prueba → subcategoría nueva. */
export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  sweaters: 'mujer-tejidos',
  buzos: 'hombre-buzos',
  camperas: 'hombre-camperas',
  camisas: 'mujer-camisas-blusas',
  remeras: 'mujer-remeras-manga-corta',
  musculosas: 'mujer-remeras-manga-corta',
  sastreria: 'mujer-pantalones',
  conjuntos: 'bebes-conjuntos',
  pilotos: 'mujer-tapados',
  night: 'ofertas-mujer',
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: 'sweater-premium-nuez',
    title: 'Sweater Premium Nuez',
    sku: 'KAP-SWEATERNUEZ',
    price: 48900,
    category: 'mujer-tejidos',
    imageUrl: '/catalog/prod-sweater.jpg',
    isNew: true,
    featured: true,
    weight: 480,
    description:
      'Sweater de punto premium, silueta relajada y calce cómodo. Ideal para media estación. Composición: 70% acrílico, 30% lana.',
    variants: variants('SW-NUEZ', [
      { color: 'Nuez', hex: '#c4a574' },
      { color: 'Crudo', hex: '#f3ead8' },
      { color: 'Verde bosque', hex: '#1e4d32' },
    ]),
  },
  {
    slug: 'buzo-oversize-terracota',
    title: 'Buzo Oversize Terracota',
    sku: 'KAP-BUZOTERRAC',
    price: 39900,
    category: 'hombre-buzos',
    imageUrl: '/catalog/prod-buzo.jpg',
    isNew: true,
    featured: true,
    weight: 520,
    description: 'Buzo oversize de frisa liviana, capucha y bolsillo canguro. Unisex.',
    variants: variants('BZ-TER', [
      { color: 'Terracota', hex: '#a65b3a' },
      { color: 'Negro', hex: '#111111' },
    ]),
  },
  {
    slug: 'campera-puffer-espresso',
    title: 'Campera Puffer Espresso',
    sku: 'KAP-CAMPERAESPR',
    price: 98900,
    category: 'hombre-camperas',
    imageUrl: '/catalog/prod-campera.jpg',
    featured: true,
    onSale: true,
    weight: 900,
    description: 'Campera inflada con interior térmico y cuello alto. Ideal para invierno.',
    variants: variants(
      'CP-ESP',
      [
        { color: 'Espresso', hex: '#4a3428' },
        { color: 'Negro', hex: '#111111' },
      ],
      8,
    ),
  },
  {
    slug: 'camisa-oxford-blanca',
    title: 'Camisa Oxford Blanca',
    sku: 'KAP-CAMISAOXF',
    price: 32900,
    category: 'mujer-camisas-blusas',
    imageUrl: '/catalog/prod-camisa.jpg',
    isNew: true,
    weight: 280,
    description: 'Camisa oxford de algodón, corte clásico y cuello estructurado.',
    variants: variants('CM-OXF', [
      { color: 'Blanco', hex: '#f7f7f5' },
      { color: 'Celeste', hex: '#c8d7e4' },
    ]),
  },
  {
    slug: 'remera-essential-negra',
    title: 'Remera Essential Negra',
    sku: 'KAP-REMERESSEN',
    price: 18900,
    category: 'mujer-remeras-manga-corta',
    imageUrl: '/catalog/prod-remera.jpg',
    featured: true,
    weight: 180,
    description: 'Remera de algodón 24/1, calce regular. Base del guardarropa Kaprichos.',
    variants: variants(
      'RM-ESS',
      [
        { color: 'Negro', hex: '#111111' },
        { color: 'Blanco', hex: '#f7f7f5' },
        { color: 'Verde bosque', hex: '#1e4d32' },
      ],
      20,
    ),
  },
  {
    slug: 'musculosa-layer',
    title: 'Musculosa Layer',
    sku: 'KAP-MUSCULAYER',
    price: 21900,
    category: 'mujer-remeras-manga-corta',
    imageUrl: '/catalog/prod-musculosa.jpg',
    weight: 160,
    description: 'Musculosa de morley para superponer. Tira ancha y largo generoso.',
    variants: variants('MS-LAY', [
      { color: 'Negro', hex: '#111111' },
      { color: 'Topo', hex: '#6b6358' },
    ]),
  },
  {
    slug: 'blazer-sastrero-negro',
    title: 'Blazer Sastrero Negro',
    sku: 'KAP-BLAZERSAS',
    price: 75900,
    category: 'mujer-chalecos',
    imageUrl: '/catalog/prod-sastreria.jpg',
    featured: true,
    weight: 620,
    description: 'Blazer sastrero de sarga liviana, hombreras suaves y un botón.',
    variants: variants('BL-SAS', [
      { color: 'Negro', hex: '#111111' },
      { color: 'Gris', hex: '#5c5c5c' },
    ]),
  },
  {
    slug: 'conjunto-punto-arena',
    title: 'Conjunto de Punto Arena',
    sku: 'KAP-CONJUNTOAR',
    price: 67900,
    category: 'bebes-conjuntos',
    imageUrl: '/catalog/prod-conjunto.jpg',
    isNew: true,
    featured: true,
    weight: 700,
    description: 'Conjunto de dos piezas en punto suave: sweater + pantalón jogger.',
    variants: variants('CJ-ARN', [
      { color: 'Arena', hex: '#d8c3a5' },
      { color: 'Negro', hex: '#111111' },
    ]),
  },
  {
    slug: 'piloto-lana-carbon',
    title: 'Piloto de Lana Carbón',
    sku: 'KAP-PILOTOCARB',
    price: 112000,
    category: 'mujer-tapados',
    imageUrl: '/catalog/prod-piloto.jpg',
    onSale: true,
    weight: 1100,
    description: 'Piloto largo de paño, solapa clásica y cinturón. Abrigo de temporada.',
    variants: variants(
      'PL-CAR',
      [
        { color: 'Carbón', hex: '#2c2c2c' },
        { color: 'Camel', hex: '#c4a574' },
      ],
      6,
    ),
  },
  {
    slug: 'pantalon-sastre-negro',
    title: 'Pantalón Sastre Negro',
    sku: 'KAP-PANTALONSA',
    price: 42900,
    category: 'mujer-pantalones',
    imageUrl: '/catalog/prod-sastreria.jpg',
    weight: 400,
    description: 'Pantalón sastrero de tiro medio, pinzas suaves y calce recto.',
    variants: variants('PT-SAS', [
      { color: 'Negro', hex: '#111111' },
      { color: 'Gris', hex: '#5c5c5c' },
    ]),
  },
]

export const SEED_PRODUCT_SLUGS = new Set(SEED_PRODUCTS.map((product) => product.slug))

export const SEED_COUPONS: SeedCoupon[] = [
  { code: 'KAPRI10', type: 'percent', value: 10, label: '10% off', active: true },
  { code: 'BIENVENIDA15', type: 'percent', value: 15, label: '15% off primera compra', active: true },
  { code: 'ENVIOGRATIS', type: 'shipping', value: 100, label: 'Envío gratis', active: true },
]
