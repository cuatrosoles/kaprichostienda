export function slugifyTitle(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function skuFromTitle(title: string) {
  const base = slugifyTitle(title).replace(/-/g, '').toUpperCase().slice(0, 12)
  return `KAP-${base || 'PROD'}`
}

export const SIZE_MEASURE_FIELDS = [
  { key: 'ancho', label: 'Ancho' },
  { key: 'largo', label: 'Largo' },
  { key: 'manga', label: 'Manga' },
  { key: 'hombro', label: 'Hombro' },
  { key: 'alto', label: 'Alto' },
  { key: 'sisa', label: 'Sisa' },
  { key: 'numero', label: 'Número' },
  { key: 'peso', label: 'Peso' },
] as const

export type SizeGuideColumn = { key: string; label: string }

export type SizeGuideRow = {
  talle: string
  cells: Record<string, string>
}

export type SizeGuideView = {
  columns: SizeGuideColumn[]
  rows: SizeGuideRow[]
  detalle?: string
}

function filled(value: unknown) {
  return value == null ? '' : String(value).trim()
}

export function normalizeSizeLabel(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/^talle\s*/i, '')
    .replace(/^t\.?\s*/i, '')
    .trim()
}

export function sizesMatch(a: unknown, b: unknown) {
  const left = normalizeSizeLabel(a)
  const right = normalizeSizeLabel(b)
  return Boolean(left && right && left === right)
}

const LETTER_SIZES = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl', '5xl']

function sizeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^talle\s+/i, '')
    .trim()
}

function isSizeToken(value: string) {
  const token = sizeToken(value)
  return /^(?:t\d{1,2}|\d{1,3}|xxs|xs|s|m|l|xl|xxl|xxxl|[2-5]xl|u|unico)$/.test(token)
}

function displaySizeToken(value: string) {
  return value.replace(/^talle\s+/i, '').trim()
}

/** Separa "Talle 36-38-40-46" o "S, M, L" en talles individuales. Un texto que no es lista queda igual. */
export function splitSizeLabel(value: unknown): string[] {
  const raw = String(value ?? '').trim()
  if (!raw) return []
  const body = raw.replace(/^talles?\s+/i, '').trim()
  const source = body || raw
  const separated = source
    .split(/\s*(?:,|\/|\s+y\s+|\s+e\s+|–|—|-)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)

  if (separated.length > 1 && separated.every(isSizeToken)) return separated.map(displaySizeToken)

  const words = source.split(/\s+/).filter(Boolean)
  if (words.length > 1 && words.every(isSizeToken)) return words.map(displaySizeToken)
  if (isSizeToken(source)) return [displaySizeToken(source)]
  return [raw]
}

export function compareSizes(a: string, b: string) {
  const rank = (value: string) => {
    const token = normalizeSizeLabel(value).replace(/\s+/g, '')
    const letter = LETTER_SIZES.indexOf(token)
    if (letter >= 0) return letter
    const numeric = Number(token.replace(/^t/, ''))
    if (token && Number.isFinite(numeric)) return 100 + numeric
    return 1000
  }
  const diff = rank(a) - rank(b)
  if (diff !== 0) return diff
  return a.localeCompare(b, 'es')
}

export function variantStockSku(sku: string) {
  const marker = sku.lastIndexOf('::')
  return marker > 0 ? sku.slice(0, marker) : sku
}

type StoredVariant = {
  sku?: string | null
  size?: string | null
  color?: string | null
  colorHex?: string | null
  stock?: number | null
}

export type StoreVariant = {
  sku: string
  size: string
  color: string
  colorHex: string
  stock: number
  stockSku: string
}

/** Un talle escrito como lista se vuelve un botón por talle. El stock sigue siendo el de la fila original. */
export function expandVariants(variants: StoredVariant[] | null | undefined): StoreVariant[] {
  const rows: StoreVariant[] = []
  ;(variants || []).forEach((variant, index) => {
    const labels = splitSizeLabel(variant.size)
    const sizes = labels.length ? labels : [String(variant.size || '').trim() || 'Único']
    const stockSku = String(variant.sku || '').trim() || `var-${index + 1}`
    sizes.forEach((size, sizeIndex) => {
      const sku = sizes.length === 1 || sizeIndex === 0 ? stockSku : `${stockSku}::${normalizeSizeLabel(size)}`
      rows.push({
        sku,
        size,
        color: String(variant.color || '').trim(),
        colorHex: variant.colorHex || '#111111',
        stock: Number(variant.stock ?? 0),
        stockSku,
      })
    })
  })
  return rows
}

export function variantsForColor(variants: StoreVariant[], color: string) {
  const wanted = color.trim()
  const bySize = new Map<string, StoreVariant>()
  for (const variant of variants) {
    if (variant.color !== wanted) continue
    const key = normalizeSizeLabel(variant.size)
    const previous = bySize.get(key)
    if (!previous || variant.stock > previous.stock) bySize.set(key, variant)
  }
  return [...bySize.values()].sort((a, b) => compareSizes(a.size, b.size))
}

function cellsFromSource(source: Record<string, unknown>) {
  const cells: Record<string, string> = {}
  for (const { key } of SIZE_MEASURE_FIELDS) {
    const value = filled(source[key])
    if (value) cells[key] = value
  }
  return cells
}

export function productSizeGuide(doc: object | null | undefined): SizeGuideView | null {
  if (!doc) return null
  const source = doc as Record<string, unknown>
  const detalle = filled(source.detalle)
  const rawRows = Array.isArray(source.sizeGuide) ? source.sizeGuide : []

  let rows: SizeGuideRow[] = rawRows.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const item = row as Record<string, unknown>
    const talle = filled(item.talle)
    if (!talle) return []
    return [{ talle, cells: cellsFromSource(item) }]
  })

  if (!rows.length) {
    const legacy = cellsFromSource(source)
    const talle = filled(source.talle)
    if (Object.keys(legacy).length) {
      rows = [{ talle: talle || 'Único', cells: legacy }]
    }
  }

  if (!rows.length && !detalle) return null

  const used = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row.cells)) used.add(key)
  }
  const columns = SIZE_MEASURE_FIELDS.filter(({ key }) => used.has(key)).map(({ key, label }) => ({
    key,
    label,
  }))

  return { columns, rows, detalle: detalle || undefined }
}

export function assignVariantSkus<T extends { sku?: string | null }>(
  productSku: string,
  variants: T[] | null | undefined,
): T[] | null | undefined {
  if (!Array.isArray(variants) || !productSku) return variants
  const used = new Set(variants.map((v) => String(v.sku || '').trim()).filter(Boolean))
  let next = 1
  return variants.map((variant) => {
    const current = String(variant.sku || '').trim()
    if (current) return variant
    let candidate = `${productSku}-${next}`
    while (used.has(candidate)) {
      next += 1
      candidate = `${productSku}-${next}`
    }
    used.add(candidate)
    next += 1
    return { ...variant, sku: candidate }
  })
}
