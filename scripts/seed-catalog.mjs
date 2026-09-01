import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const value = trimmed.slice(eq + 1).trim()
  if (key) process.env[key] = value
}

process.env.NODE_ENV = 'development'

const { getPayload } = await import('payload')
const { default: config } = await import(pathToFileURL(resolve(root, 'src/payload.config.ts')).href)
const { SEED_CATEGORIES, SEED_COUPONS, SEED_PRODUCTS } = await import(
  pathToFileURL(resolve(root, 'src/data/seed-catalog.ts')).href
)

const payload = await getPayload({ config })

async function upsertBySlug(collection, slug, data) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection,
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
    return existing.docs[0].id
  }
  const created = await payload.create({
    collection,
    data: { ...data, slug },
    overrideAccess: true,
  })
  return created.id
}

const categoryIds = {}

for (const cat of SEED_CATEGORIES) {
  const id = await upsertBySlug('categories', cat.slug, {
    title: cat.title,
    imageUrl: cat.imageUrl,
    menuGroup: cat.menuGroup,
    sort: cat.sort,
    showOnHome: true,
  })
  categoryIds[cat.slug] = id
  console.log(`Categoría ${cat.slug} (#${id})`)
}

for (const product of SEED_PRODUCTS) {
  const categoryId = categoryIds[product.category]
  if (!categoryId) {
    throw new Error(`Falta la categoría ${product.category} para ${product.slug}`)
  }
  const stock = product.variants.reduce((acc, v) => acc + v.stock, 0)
  const id = await upsertBySlug('products', product.slug, {
    title: product.title,
    description: product.description,
    price: product.price,
    category: categoryId,
    imageUrl: product.imageUrl,
    isNew: Boolean(product.isNew),
    onSale: Boolean(product.onSale),
    featured: Boolean(product.featured),
    status: 'published',
    weight: product.weight,
    variants: product.variants,
    stock,
  })
  console.log(`Producto ${product.slug} (#${id})`)
}

for (const coupon of SEED_COUPONS) {
  const existing = await payload.find({
    collection: 'coupons',
    where: { code: { equals: coupon.code } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'coupons',
      id: existing.docs[0].id,
      data: coupon,
      overrideAccess: true,
    })
    console.log(`Cupón ${coupon.code} (#${existing.docs[0].id})`)
  } else {
    const created = await payload.create({
      collection: 'coupons',
      data: coupon,
      overrideAccess: true,
    })
    console.log(`Cupón ${coupon.code} (#${created.id})`)
  }
}

console.log('Catálogo de prueba sincronizado con Payload / Supabase.')

try {
  const hero = await payload.findGlobal({
    slug: 'home-hero',
    overrideAccess: true,
  })
  if (!hero.slides?.length) {
    await payload.updateGlobal({
      slug: 'home-hero',
      data: {
        autoplay: true,
        intervalSeconds: 6,
        transition: 'fade',
        durationMs: 800,
        showArrows: true,
        showDots: true,
        slides: [
          {
            active: true,
            imageUrl: '/catalog/hero-temporada.jpg',
            alt: 'Nueva temporada Kaprichos',
            objectPosition: 'center_top',
            eyebrow: 'Nueva',
            title: 'Temporada',
            badges: [
              { text: '3 cuotas sin interés' },
              { text: '20% OFF efectivo o transferencia' },
            ],
            ctaLabel: 'Ver productos',
            ctaHref: '/productos',
          },
        ],
      },
      overrideAccess: true,
    })
    console.log('Hero de inicio creado con la diapositiva inicial.')
  } else {
    console.log('Hero de inicio ya tiene diapositivas; no se pisa.')
  }
} catch (error) {
  console.warn('No se pudo guardar el hero (¿schema pendiente de push?):', error)
}

process.exit(0)
