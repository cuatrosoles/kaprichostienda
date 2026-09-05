import type { StoreSetting } from '@/payload-types'
import { lookupArgentinePostalCode, normalizeArgentineZip, type PostalLocation } from '@/lib/postalCode'
import { localFulfillmentOptions } from '@/lib/fulfillment'

export { isFreeFulfillment, localFulfillmentOptions, OWN_MESSENGER_ID, STORE_PICKUP_ID } from '@/lib/fulfillment'

export type ShippingOption = {
  id: string
  name: string
  cost: number
  eta: string
}

export type ShippingQuote = {
  options: ShippingOption[]
  location: PostalLocation | null
  source: 'api' | 'internal'
}

function withLocalFulfillment(options: ShippingOption[], settings?: StoreSetting | null) {
  const extras = localFulfillmentOptions(settings)
  const extraIds = new Set(extras.map((option) => option.id))
  return [...options.filter((option) => !extraIds.has(option.id)), ...extras]
}

function num(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function shippingRegion(digits: string): 'caba' | 'gba' | 'interior' {
  const prefix = parseInt(digits.substring(0, 2), 10)
  if (prefix >= 10 && prefix <= 14) return 'caba'
  if (prefix >= 16 && prefix <= 18) return 'gba'
  return 'interior'
}

function quoteInternal(
  settings: StoreSetting | null | undefined,
  digits: string,
  totalWeight: number,
  orderTotal: number,
): ShippingOption[] {
  const baseCost = num(settings?.shipBaseCost, 4500)
  const perKg = num(settings?.shipPerKg, 850)
  const weightSurcharge = Math.ceil(Math.max(0, totalWeight) / 1000) * perKg
  const region = shippingRegion(digits)
  const multiplier =
    region === 'caba'
      ? num(settings?.shipCabaMultiplier, 0.9)
      : region === 'gba'
        ? num(settings?.shipGbaMultiplier, 1)
        : num(settings?.shipInteriorMultiplier, 1.6)
  const standard = Math.round((baseCost + weightSurcharge) * multiplier)
  const freeFrom = num(settings?.freeShippingFrom, 0)
  const makeFree = freeFrom > 0 && orderTotal >= freeFrom

  const options: ShippingOption[] = []
  if (settings?.standardEnabled !== false) {
    options.push({
      id: 'standard_home',
      name: String(settings?.standardName || 'Correo Argentino — Envío a domicilio'),
      cost: makeFree ? 0 : standard,
      eta: String(settings?.standardEta || '3 a 6 días hábiles'),
    })
  }
  if (settings?.expressEnabled !== false) {
    options.push({
      id: 'express_home',
      name: String(settings?.expressName || 'Envío Express prioritario'),
      cost: makeFree ? 0 : Math.round(standard * num(settings?.expressMultiplier, 1.45)),
      eta: String(settings?.expressEta || '24 a 48 horas hábiles'),
    })
  }
  if (settings?.pickupEnabled !== false) {
    options.push({
      id: 'pickup',
      name: String(settings?.pickupName || 'Retiro en punto de correo'),
      cost: makeFree ? 0 : Math.round(standard * num(settings?.pickupMultiplier, 0.75)),
      eta: String(settings?.pickupEta || '4 a 7 días hábiles'),
    })
  }
  return options
}

function parseApiOptions(payload: unknown): ShippingOption[] | null {
  if (!payload || typeof payload !== 'object') return null
  const options = (payload as { options?: unknown }).options
  if (!Array.isArray(options) || !options.length) return null
  const mapped = options
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const row = raw as Record<string, unknown>
      const id = String(row.id || '').trim()
      const name = String(row.name || '').trim()
      const cost = Number(row.cost)
      if (!id || !name || !Number.isFinite(cost)) return null
      return {
        id,
        name,
        cost: Math.max(0, Math.round(cost)),
        eta: String(row.eta || 'A coordinar'),
      } satisfies ShippingOption
    })
    .filter((row): row is ShippingOption => Boolean(row))
  return mapped.length ? mapped : null
}

async function quoteFromApi(
  settings: StoreSetting,
  zipCode: string,
  totalWeight: number,
  orderTotal: number,
  location: PostalLocation | null,
): Promise<ShippingOption[] | null> {
  const url = String(settings.shippingApiUrl || '').trim()
  if (!url) return null
  const timeout = Math.min(20000, Math.max(2000, num(settings.shippingApiTimeout, 8000)))
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const apiKey = String(settings.shippingApiKey || '').trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      zipCode,
      totalWeight,
      orderTotal,
      originZip: String(settings.shippingOriginZip || '').trim(),
      location,
    }),
    signal: AbortSignal.timeout(timeout),
    cache: 'no-store',
  })
  if (!response.ok) return null
  return parseApiOptions(await response.json().catch(() => null))
}

export async function quoteShipping(args: {
  zipCode: string
  totalWeight?: number
  orderTotal?: number
  settings?: StoreSetting | null
}): Promise<ShippingQuote> {
  const { digits } = normalizeArgentineZip(String(args.zipCode || ''))
  if (digits.length !== 4) {
    throw new Error('Código postal inválido')
  }

  const location = await lookupArgentinePostalCode(String(args.zipCode))
  const totalWeight = Math.max(0, Number(args.totalWeight || 0))
  const orderTotal = Math.max(0, Number(args.orderTotal || 0))
  const settings = args.settings

  if (settings?.shippingMode === 'api') {
    try {
      const apiOptions = await quoteFromApi(settings, String(args.zipCode), totalWeight, orderTotal, location)
      if (apiOptions) {
        return { options: withLocalFulfillment(apiOptions, settings), location, source: 'api' }
      }
    } catch {
      /* cae a la tarifa interna */
    }
  }

  return {
    options: withLocalFulfillment(quoteInternal(settings, digits, totalWeight, orderTotal), settings),
    location,
    source: 'internal',
  }
}
