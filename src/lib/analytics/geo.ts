const AR_PROVINCES: Record<string, string> = {
  A: 'Salta',
  B: 'Buenos Aires',
  C: 'CABA',
  D: 'San Luis',
  E: 'Entre Ríos',
  F: 'La Rioja',
  G: 'Santiago del Estero',
  H: 'Chaco',
  J: 'San Juan',
  K: 'Catamarca',
  L: 'La Pampa',
  M: 'Mendoza',
  N: 'Misiones',
  P: 'Formosa',
  Q: 'Neuquén',
  R: 'Río Negro',
  S: 'Santa Fe',
  T: 'Tucumán',
  U: 'Chubut',
  V: 'Tierra del Fuego',
  W: 'Corrientes',
  X: 'Córdoba',
  Y: 'Jujuy',
  Z: 'Santa Cruz',
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina',
  BR: 'Brasil',
  CL: 'Chile',
  UY: 'Uruguay',
  PY: 'Paraguay',
  BO: 'Bolivia',
  PE: 'Perú',
  CO: 'Colombia',
  MX: 'México',
  US: 'Estados Unidos',
  ES: 'España',
  IT: 'Italia',
}

export type GeoInfo = {
  country: string
  countryCode: string
  region: string
  city: string
}

function decodeHeader(value: string | null) {
  if (!value) return ''
  try {
    return decodeURIComponent(value.replace(/\+/g, ' ')).trim()
  } catch {
    return value.trim()
  }
}

function regionName(countryCode: string, regionRaw: string) {
  const code = regionRaw.replace(/^AR-?/i, '').toUpperCase()
  if (countryCode === 'AR' && AR_PROVINCES[code]) return AR_PROVINCES[code]
  return regionRaw.replace(/^AR-?/i, '').trim()
}

export function geoFromHeaders(headers: Headers): GeoInfo {
  const countryCode = (headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || '')
    .trim()
    .toUpperCase()
  const regionRaw = decodeHeader(headers.get('x-vercel-ip-country-region'))
  const city = decodeHeader(headers.get('x-vercel-ip-city'))
  return {
    countryCode,
    country: COUNTRY_NAMES[countryCode] || countryCode,
    region: regionName(countryCode, regionRaw),
    city,
  }
}

function isPrivateIp(ip: string) {
  return (
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    /^172\.(2[0-9]|3[0-1])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  )
}

const geoCache = new Map<string, GeoInfo>()

export async function lookupGeoFallback(ip: string, existing: GeoInfo): Promise<GeoInfo> {
  if (existing.countryCode || existing.city) return existing
  if (!ip || isPrivateIp(ip)) return existing
  const hit = geoCache.get(ip)
  if (hit) return hit
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 700)
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return existing
    const data = (await res.json()) as {
      country_name?: string
      country?: string
      region?: string
      city?: string
      error?: boolean
    }
    if (data.error) return existing
    const countryCode = String(data.country || '').toUpperCase()
    const geo: GeoInfo = {
      countryCode,
      country: data.country_name || COUNTRY_NAMES[countryCode] || countryCode,
      region: regionName(countryCode, String(data.region || '')),
      city: String(data.city || ''),
    }
    if (geoCache.size > 400) geoCache.clear()
    geoCache.set(ip, geo)
    return geo
  } catch {
    return existing
  }
}
