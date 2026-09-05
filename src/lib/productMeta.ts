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
