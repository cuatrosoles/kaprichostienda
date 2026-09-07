import type { Payload } from 'payload'
import { arDateKey, arDayBounds } from '@/lib/analytics/privacy'

export type AnalyticsRange = 'today' | '7d' | '30d' | '90d'

export type AnalyticsStats = {
  range: { key: AnalyticsRange; from: string; to: string }
  truncated: boolean
  totals: {
    sessions: number
    humanSessions: number
    uniqueVisitors: number
    pageviews: number
    bounces: number
    bounceRate: number
    bots: number
    avgDurationSec: number
    cart: number
    checkout: number
    purchases: number
    newsletters: number
  }
  daily: { date: string; sessions: number; unique: number; bots: number; purchases: number }[]
  devices: { key: string; count: number }[]
  countries: { key: string; count: number }[]
  regions: { key: string; count: number }[]
  cities: { key: string; count: number }[]
  channels: { key: string; count: number }[]
  campaigns: {
    source: string
    medium: string
    campaign: string
    sessions: number
    unique: number
    bounceRate: number
    purchases: number
  }[]
  pages: { path: string; views: number }[]
  bots: { name: string; sessions: number; pages: number }[]
  referrers: { host: string; count: number }[]
  recent: {
    id: number
    startedAt: string
    landingPath: string
    city: string
    region: string
    country: string
    device: string
    isBot: boolean
    botName: string
    pageCount: number
    utmCampaign: string
    channel: string
  }[]
}

type SessionDoc = {
  id: number
  visitorId?: string | null
  startedAt?: string | null
  landingPath?: string | null
  pageCount?: number | null
  pathLog?: unknown
  referrerHost?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  channel?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  device?: string | null
  isBot?: boolean | null
  botName?: string | null
  isBounce?: boolean | null
  durationMs?: number | null
  reachedCart?: boolean | null
  reachedCheckout?: boolean | null
  purchased?: boolean | null
  newsletter?: boolean | null
}

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export function resolveRange(key: string | null | undefined): { key: AnalyticsRange; from: string; to: string } {
  const range: AnalyticsRange = key === 'today' || key === '7d' || key === '90d' ? key : '30d'
  const to = arDateKey()
  if (range === 'today') return { key: range, from: to, to }
  const days = RANGE_DAYS[range] - 1
  const toDate = new Date(`${to}T12:00:00-03:00`)
  toDate.setDate(toDate.getDate() - days)
  return { key: range, from: arDateKey(toDate), to }
}

function bump(map: Map<string, number>, key: string, amount = 1) {
  const label = key.trim() || 'Sin dato'
  map.set(label, (map.get(label) || 0) + amount)
}

function top(map: Map<string, number>, limit = 8) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }))
}

function dateKeysBetween(from: string, to: string) {
  const keys: string[] = []
  const cursor = new Date(`${from}T12:00:00-03:00`)
  const end = new Date(`${to}T12:00:00-03:00`)
  while (cursor <= end) {
    keys.push(arDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export async function getAnalyticsStats(payload: Payload, rangeKey?: string | null): Promise<AnalyticsStats> {
  const range = resolveRange(rangeKey)
  const { from, to } = arDayBounds(range.from, range.to)
  const docs: SessionDoc[] = []
  let page = 1
  let truncated = false

  while (docs.length < 8000) {
    const result = await payload.find({
      collection: 'visit-sessions',
      where: {
        and: [{ startedAt: { greater_than_equal: from.toISOString() } }, { startedAt: { less_than_equal: to.toISOString() } }],
      },
      sort: '-startedAt',
      limit: 200,
      page,
      depth: 0,
      overrideAccess: true,
    })
    docs.push(...(result.docs as SessionDoc[]))
    if (page >= result.totalPages) break
    page += 1
    if (docs.length >= 8000) truncated = true
  }

  const humans = docs.filter((d) => !d.isBot)
  const unique = new Set(humans.map((d) => d.visitorId || String(d.id)))
  const pageviews = docs.reduce((acc, d) => acc + Number(d.pageCount || 0), 0)
  const bounces = humans.filter((d) => d.isBounce !== false && Number(d.pageCount || 1) <= 1).length
  const durationSum = humans.reduce((acc, d) => acc + Number(d.durationMs || 0), 0)

  const devices = new Map<string, number>()
  const countries = new Map<string, number>()
  const regions = new Map<string, number>()
  const cities = new Map<string, number>()
  const channels = new Map<string, number>()
  const pages = new Map<string, number>()
  const referrers = new Map<string, number>()
  const botMap = new Map<string, { sessions: number; pages: number }>()
  const campaignMap = new Map<
    string,
    { source: string; medium: string; campaign: string; sessions: number; unique: Set<string>; bounces: number; purchases: number }
  >()
  const dailyMap = new Map<string, { sessions: number; unique: Set<string>; bots: number; purchases: number }>()

  for (const key of dateKeysBetween(range.from, range.to)) {
    dailyMap.set(key, { sessions: 0, unique: new Set(), bots: 0, purchases: 0 })
  }

  for (const doc of docs) {
    const day = doc.startedAt ? arDateKey(new Date(doc.startedAt)) : range.to
    const bucket = dailyMap.get(day) || { sessions: 0, unique: new Set<string>(), bots: 0, purchases: 0 }
    if (doc.isBot) bucket.bots += 1
    else {
      bucket.sessions += 1
      bucket.unique.add(doc.visitorId || String(doc.id))
    }
    if (doc.purchased) bucket.purchases += 1
    dailyMap.set(day, bucket)

    bump(devices, doc.isBot ? 'bot' : doc.device || 'desktop')
    bump(channels, doc.channel || (doc.isBot ? 'bot' : 'direct'))
    if (doc.country) bump(countries, doc.country)
    if (doc.region) bump(regions, `${doc.region}${doc.country ? ` (${doc.country})` : ''}`)
    if (doc.city) bump(cities, `${doc.city}${doc.region ? `, ${doc.region}` : ''}`)
    if (doc.referrerHost) bump(referrers, doc.referrerHost)

    const pathList = Array.isArray(doc.pathLog) ? doc.pathLog.map((p) => String(p)) : []
    if (pathList.length) {
      for (const path of pathList) bump(pages, path)
    } else if (doc.landingPath) {
      bump(pages, doc.landingPath, Number(doc.pageCount || 1))
    }

    if (doc.isBot) {
      const name = doc.botName || 'Bot'
      const prev = botMap.get(name) || { sessions: 0, pages: 0 }
      prev.sessions += 1
      prev.pages += Number(doc.pageCount || 0)
      botMap.set(name, prev)
    }

    if (doc.utmSource || doc.utmCampaign || doc.utmMedium) {
      const source = doc.utmSource || '(directo)'
      const medium = doc.utmMedium || '(none)'
      const campaign = doc.utmCampaign || '(sin campaña)'
      const key = `${source}|${medium}|${campaign}`
      const row =
        campaignMap.get(key) ||
        { source, medium, campaign, sessions: 0, unique: new Set<string>(), bounces: 0, purchases: 0 }
      row.sessions += 1
      row.unique.add(doc.visitorId || String(doc.id))
      if (doc.isBounce !== false && Number(doc.pageCount || 1) <= 1) row.bounces += 1
      if (doc.purchased) row.purchases += 1
      campaignMap.set(key, row)
    }
  }

  return {
    range,
    truncated,
    totals: {
      sessions: docs.length,
      humanSessions: humans.length,
      uniqueVisitors: unique.size,
      pageviews,
      bounces,
      bounceRate: humans.length ? Math.round((bounces / humans.length) * 1000) / 10 : 0,
      bots: docs.length - humans.length,
      avgDurationSec: humans.length ? Math.round(durationSum / humans.length / 1000) : 0,
      cart: humans.filter((d) => d.reachedCart).length,
      checkout: humans.filter((d) => d.reachedCheckout).length,
      purchases: humans.filter((d) => d.purchased).length,
      newsletters: humans.filter((d) => d.newsletter).length,
    },
    daily: [...dailyMap.entries()].map(([date, row]) => ({
      date,
      sessions: row.sessions,
      unique: row.unique.size,
      bots: row.bots,
      purchases: row.purchases,
    })),
    devices: top(devices),
    countries: top(countries),
    regions: top(regions, 10),
    cities: top(cities, 10),
    channels: top(channels),
    campaigns: [...campaignMap.values()]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20)
      .map((row) => ({
        source: row.source,
        medium: row.medium,
        campaign: row.campaign,
        sessions: row.sessions,
        unique: row.unique.size,
        bounceRate: row.sessions ? Math.round((row.bounces / row.sessions) * 1000) / 10 : 0,
        purchases: row.purchases,
      })),
    pages: top(pages, 12).map((row) => ({ path: row.key, views: row.count })),
    bots: [...botMap.entries()]
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 12)
      .map(([name, row]) => ({ name, sessions: row.sessions, pages: row.pages })),
    referrers: top(referrers, 10).map((row) => ({ host: row.key, count: row.count })),
    recent: docs.slice(0, 18).map((doc) => ({
      id: doc.id,
      startedAt: doc.startedAt || '',
      landingPath: doc.landingPath || '/',
      city: doc.city || '',
      region: doc.region || '',
      country: doc.country || '',
      device: doc.device || '',
      isBot: Boolean(doc.isBot),
      botName: doc.botName || '',
      pageCount: Number(doc.pageCount || 0),
      utmCampaign: doc.utmCampaign || '',
      channel: doc.channel || '',
    })),
  }
}
