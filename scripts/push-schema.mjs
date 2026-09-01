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

const payload = await getPayload({ config })
console.log('Esquema de Payload sincronizado con Supabase.')

const defaultHero = {
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
}

try {
  const hero = await payload.findGlobal({
    slug: 'home-hero',
    overrideAccess: true,
  })
  if (!hero?.slides?.length) {
    await payload.updateGlobal({
      slug: 'home-hero',
      data: defaultHero,
      overrideAccess: true,
    })
    console.log('Hero de inicio creado con la diapositiva de la portada.')
  } else {
    console.log('Hero de inicio ya tenía diapositivas.')
  }
} catch {
  await payload.updateGlobal({
    slug: 'home-hero',
    data: defaultHero,
    overrideAccess: true,
  })
  console.log('Hero de inicio creado con la diapositiva de la portada.')
}

process.exit(0)
