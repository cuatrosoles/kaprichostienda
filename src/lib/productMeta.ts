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

export const PRODUCT_SPEC_FIELDS = [
  { key: 'ancho', label: 'Ancho' },
  { key: 'alto', label: 'Alto' },
  { key: 'largo', label: 'Largo' },
  { key: 'manga', label: 'Manga' },
  { key: 'hombro', label: 'Hombro' },
  { key: 'sisa', label: 'Sisa' },
  { key: 'talle', label: 'Talle' },
  { key: 'numero', label: 'Número' },
  { key: 'peso', label: 'Peso' },
  { key: 'detalle', label: 'Detalle' },
] as const

export type ProductSpec = { key: string; label: string; value: string }

export function productSpecs(doc: object | null | undefined): ProductSpec[] {
  if (!doc) return []
  const source = doc as Record<string, unknown>
  return PRODUCT_SPEC_FIELDS.flatMap(({ key, label }) => {
    const raw = source[key]
    const value = raw == null ? '' : String(raw).trim()
    return value ? [{ key, label, value }] : []
  })
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
