export type PostalLocation = {
  zipCode: string
  locality: string
  city: string
  province: string
  label: string
}

const PROVINCE_NAMES: Record<string, string> = {
  A: 'Salta',
  B: 'Buenos Aires',
  C: 'Ciudad Autónoma de Buenos Aires',
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

const PROVINCE_SPELLING: Record<string, string> = {
  'BUENOS AIRES': 'Buenos Aires',
  CORDOBA: 'Córdoba',
  'ENTRE RIOS': 'Entre Ríos',
  TUCUMAN: 'Tucumán',
  NEUQUEN: 'Neuquén',
  'RIO NEGRO': 'Río Negro',
  'TIERRA DEL FUEGO': 'Tierra del Fuego',
  'SANTIAGO DEL ESTERO': 'Santiago del Estero',
  'SAN LUIS': 'San Luis',
  'SAN JUAN': 'San Juan',
  'LA RIOJA': 'La Rioja',
  'LA PAMPA': 'La Pampa',
  'CIUDAD AUTONOMA DE BUENOS AIRES': 'Ciudad Autónoma de Buenos Aires',
  'AUTONOMOUS CITY OF BUENOS AIRES': 'Ciudad Autónoma de Buenos Aires',
  CABA: 'Ciudad Autónoma de Buenos Aires',
  'CAPITAL FEDERAL': 'Ciudad Autónoma de Buenos Aires',
}

const SKIP_NAME = /ESTAFETA|HOSPITAL|SANATORIO|CHACRA|SUCURSAL|OFICINA POSTAL/

function titleCase(value: string) {
  const cleaned = value
    .replace(/\s*\(.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''
  const key = cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
  if (PROVINCE_SPELLING[key]) return PROVINCE_SPELLING[key]
  return cleaned
    .toLowerCase()
    .split(/(\s+)/)
    .map((word, index) => {
      if (/^\s+$/.test(word)) return word
      if (index > 0 && /^(de|del|la|las|los|y|e)$/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
}

export function normalizeArgentineZip(raw: string) {
  const compact = String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  const digits = compact.match(/\d{4}/)?.[0] || ''
  const letter = /^[A-Z]/.test(compact) ? compact[0] : ''
  return { compact, digits, letter }
}

function sameName(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

function locationLabel(locality: string, city: string, province: string) {
  const parts: string[] = []
  if (locality) parts.push(locality)
  if (city && !sameName(city, locality) && !sameName(city, province) && !province.toLowerCase().includes(city.toLowerCase())) {
    parts.push(city)
  }
  if (province && !parts.some((part) => sameName(part, province))) parts.push(province)
  return parts.join(', ')
}

function cleanPlaceName(value: string) {
  return titleCase(
    value
      .replace(/^(municipio de|ciudad de|partido de)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function isGenericLocality(value: string) {
  return /^(centro|microcentro|ciudad|capital|gran\b.+(norte|sur|este|oeste|centro))$/i.test(value)
}

function makeLocation(zipCode: string, locality: string, city: string, province: string): PostalLocation | null {
  let loc = cleanPlaceName(locality)
  const cty = cleanPlaceName(city) || loc
  const prov = titleCase(province)
  if (isGenericLocality(loc) && cty) loc = cty
  if (!prov && !loc && !cty) return null
  return {
    zipCode,
    locality: loc || cty,
    city: cty || loc,
    province: prov,
    label: locationLabel(loc || cty, cty, prov),
  }
}

function knownProvince(value: string) {
  const key = value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
  return Boolean(PROVINCE_SPELLING[key] || Object.values(PROVINCE_NAMES).some((name) => name.toUpperCase() === key))
}

async function fromZippopotam(digits: string): Promise<PostalLocation | null> {
  const res = await fetch(`https://api.zippopotam.us/AR/${digits}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(3500),
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    places?: { 'place name'?: string; state?: string; latitude?: string; longitude?: string }[]
  }
  const places = (data.places || []).filter((p) => p['place name'] && knownProvince(String(p.state || '')))
  if (!places.length) return null

  const stateVotes = places.reduce<Record<string, number>>((acc, place) => {
    const state = String(place.state).trim().toUpperCase()
    acc[state] = (acc[state] || 0) + 1
    return acc
  }, {})
  const majorityState = Object.entries(stateVotes).sort((a, b) => b[1] - a[1])[0]?.[0]
  const majority = places.filter((place) => String(place.state).trim().toUpperCase() === majorityState)
  const pool = majority.length ? majority : places

  const rawNames = pool.map((p) => String(p['place name']).toUpperCase())
  const allRaw = (data.places || []).map((p) => String(p['place name'] || '').toUpperCase())
  const coordKeys = pool.map((p) => `${Number(p.latitude).toFixed(3)},${Number(p.longitude).toFixed(3)}`)
  const coordCount = coordKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const scored = pool.map((place, index) => {
    const raw = rawNames[index]
    const skip = SKIP_NAME.test(raw) || raw.startsWith('BARRIO ') || raw.length < 4
    const mentions = allRaw.filter((other) => other !== raw && other.includes(raw)).length
    const state = String(place.state || '').toUpperCase()
    const matchesState = Boolean(state && (raw === state || raw.includes(state)))
    const uniqueCoords = (coordCount[coordKeys[index]] || 0) <= 3
    return {
      name: titleCase(String(place['place name'])),
      province: place.state || '',
      score: skip ? 0 : mentions * 8 + (matchesState ? 50 : 0) + (uniqueCoords ? 15 : 0) + raw.split(/\s+/).length,
    }
  })
  scored.sort((a, b) => b.score - a.score)
  const best = scored.find((item) => item.score > 0) || scored[0]
  if (!best) return null
  return makeLocation(digits, best.name, best.name, best.province)
}

async function fromNominatim(digits: string): Promise<PostalLocation | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('postalcode', digits)
  url.searchParams.set('country', 'Argentina')
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '1')
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'KaprichosTienda/1.0 (https://kaprichostienda.vercel.app)' },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) return null
  const rows = (await res.json()) as {
    address?: {
      suburb?: string
      neighbourhood?: string
      city_district?: string
      town?: string
      village?: string
      city?: string
      state?: string
    }
  }[]
  const address = rows[0]?.address
  if (!address) return null
  const locality =
    address.suburb || address.neighbourhood || address.town || address.village || address.city_district || ''
  const city = address.city || address.city_district || address.town || address.village || locality
  const province = address.state || ''
  return makeLocation(digits, locality || city, city, province)
}

function fromRanges(digits: string, letter: string): PostalLocation | null {
  const n = Number(digits)
  if (letter && PROVINCE_NAMES[letter]) {
    const province = PROVINCE_NAMES[letter]
    const city = letter === 'C' ? province : ''
    return makeLocation(digits, city, city, province)
  }
  if (n >= 1000 && n <= 1499) {
    return makeLocation(digits, 'Ciudad Autónoma de Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'CABA')
  }
  if (n >= 1600 && n <= 1999) return makeLocation(digits, '', '', 'Buenos Aires')
  return letter ? makeLocation(digits, '', '', PROVINCE_NAMES[letter] || '') : null
}

export async function lookupArgentinePostalCode(raw: string): Promise<PostalLocation | null> {
  const { digits, letter } = normalizeArgentineZip(raw)
  if (digits.length !== 4) return null

  const [zippo, osm] = await Promise.all([
    fromZippopotam(digits).catch(() => null),
    fromNominatim(digits).catch(() => null),
  ])

  if (osm?.locality || osm?.city) return osm
  if (zippo?.locality) return zippo
  return osm || fromRanges(digits, letter)
}
