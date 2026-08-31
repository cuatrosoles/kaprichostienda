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
  menuGroup: 'destacados' | 'remeras' | 'abrigo' | 'total'
  sort: number
}

export type SeedProduct = {
  slug: string
  title: string
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

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: 'sweaters', title: 'Sweater Premium', imageUrl: '/catalog/prod-sweater.jpg', menuGroup: 'abrigo', sort: 10 },
  { slug: 'buzos', title: 'Buzos y Camperitas', imageUrl: '/catalog/prod-buzo.jpg', menuGroup: 'abrigo', sort: 20 },
  { slug: 'camperas', title: 'Camperas Premium', imageUrl: '/catalog/prod-campera.jpg', menuGroup: 'abrigo', sort: 30 },
  { slug: 'camisas', title: 'Camisa Premium', imageUrl: '/catalog/prod-camisa.jpg', menuGroup: 'remeras', sort: 40 },
  { slug: 'remeras', title: 'Remera Premium', imageUrl: '/catalog/prod-remera.jpg', menuGroup: 'remeras', sort: 50 },
  { slug: 'musculosas', title: 'Musculosas', imageUrl: '/catalog/prod-musculosa.jpg', menuGroup: 'remeras', sort: 60 },
  { slug: 'sastreria', title: 'Sastrería', imageUrl: '/catalog/prod-sastreria.jpg', menuGroup: 'total', sort: 70 },
  { slug: 'conjuntos', title: 'Conjuntos', imageUrl: '/catalog/prod-conjunto.jpg', menuGroup: 'total', sort: 80 },
  { slug: 'pilotos', title: 'Pilotos y Abrigos', imageUrl: '/catalog/prod-piloto.jpg', menuGroup: 'abrigo', sort: 90 },
  { slug: 'night', title: 'Night', imageUrl: '/catalog/prod-sastreria.jpg', menuGroup: 'destacados', sort: 100 },
]

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: 'sweater-premium-nuez',
    title: 'Sweater Premium Nuez',
    price: 48900,
    category: 'sweaters',
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
    price: 39900,
    category: 'buzos',
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
    price: 98900,
    category: 'camperas',
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
    price: 32900,
    category: 'camisas',
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
    price: 18900,
    category: 'remeras',
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
    price: 21900,
    category: 'musculosas',
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
    price: 75900,
    category: 'sastreria',
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
    price: 67900,
    category: 'conjuntos',
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
    price: 112000,
    category: 'pilotos',
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
    price: 42900,
    category: 'sastreria',
    imageUrl: '/catalog/prod-sastreria.jpg',
    weight: 400,
    description: 'Pantalón sastrero de tiro medio, pinzas suaves y calce recto.',
    variants: variants('PT-SAS', [
      { color: 'Negro', hex: '#111111' },
      { color: 'Gris', hex: '#5c5c5c' },
    ]),
  },
]

export const SEED_COUPONS: SeedCoupon[] = [
  { code: 'KAPRI10', type: 'percent', value: 10, label: '10% off', active: true },
  { code: 'BIENVENIDA15', type: 'percent', value: 15, label: '15% off primera compra', active: true },
  { code: 'ENVIOGRATIS', type: 'shipping', value: 100, label: 'Envío gratis', active: true },
]
