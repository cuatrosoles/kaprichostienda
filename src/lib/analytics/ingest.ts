import type { Payload } from 'payload'
import { detectBot, isStorePath } from '@/lib/analytics/bots'
import { classifyChannel, referrerHost } from '@/lib/analytics/channel'
import { parseDevice } from '@/lib/analytics/device'
import { geoFromHeaders, lookupGeoFallback } from '@/lib/analytics/geo'
import { cleanPath, clip, hashIp } from '@/lib/analytics/privacy'
import { payloadClient } from '@/lib/payload'

export type AnalyticsEventName = 'pageview' | 'ping' | 'cart' | 'checkout' | 'purchase' | 'newsletter'

export type IngestInput = {
  event: AnalyticsEventName
  path: string
  title?: string
  referrer?: string
  visitorId: string
  sessionId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  durationMs?: number
  value?: number
  headers: Headers
  ip: string
}

const MAX_PATHS = 40
let lastCleanup = 0

function ownHostFromHeaders(headers: Headers) {
  const raw = headers.get('x-forwarded-host') || headers.get('host') || ''
  return raw.split(',')[0].trim().replace(/^www\./, '').toLowerCase()
}

function sessionWhere(sessionId: string) {
  return { sessionId: { equals: sessionId } }
}

function asPathList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '')).filter(Boolean)
}

export async function ingestVisit(input: IngestInput) {
  const path = cleanPath(input.path)
  if (!isStorePath(path)) return

  const payload = await payloadClient()
  const settings = await payload.findGlobal({ slug: 'store-settings', overrideAccess: true }).catch(() => null)
  if (settings && settings.analyticsEnabled === false) return

  const ua = input.headers.get('user-agent') || ''
  const bot = detectBot(ua)
  if (bot.isBot && settings && settings.analyticsTrackBots === false) return

  const visitorId = clip(input.visitorId || `v_${hashIp(input.ip)}`, 80) || `v_${hashIp(input.ip)}`
  let sessionId = clip(input.sessionId, 80)
  if (bot.isBot) {
    const day = new Date().toISOString().slice(0, 10)
    sessionId = `bot_${day}_${hashIp(`${input.ip}|${ua}`)}`
  } else if (!sessionId) {
    sessionId = `s_${hashIp(`${visitorId}|${Date.now()}`)}`
  }

  const device = parseDevice(ua, bot.isBot)
  let geo = geoFromHeaders(input.headers)
  if (!bot.isBot) geo = await lookupGeoFallback(input.ip, geo)

  const ownHost = ownHostFromHeaders(input.headers)
  const referrer = clip(input.referrer, 300)
  const host = referrerHost(referrer, ownHost)
  const channel = classifyChannel({
    isBot: bot.isBot,
    referrer,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    ownHost,
  })

  const now = new Date().toISOString()
  const existing = await payload.find({
    collection: 'visit-sessions',
    where: sessionWhere(sessionId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const current = existing.docs[0]

  if (!current) {
    const firstPath = path
    const data = {
      sessionId,
      visitorId,
      startedAt: now,
      lastSeenAt: now,
      landingPath: firstPath,
      exitPath: firstPath,
      pageCount: input.event === 'pageview' ? 1 : 0,
      pathLog: input.event === 'pageview' ? [firstPath] : [],
      referrer: referrer || undefined,
      referrerHost: host || undefined,
      utmSource: clip(input.utmSource, 80) || undefined,
      utmMedium: clip(input.utmMedium, 80) || undefined,
      utmCampaign: clip(input.utmCampaign, 80) || undefined,
      utmContent: clip(input.utmContent, 80) || undefined,
      utmTerm: clip(input.utmTerm, 80) || undefined,
      channel,
      country: geo.country || undefined,
      countryCode: geo.countryCode || undefined,
      region: geo.region || undefined,
      city: geo.city || undefined,
      device: device.device,
      browser: device.browser,
      os: device.os,
      isBot: bot.isBot,
      botName: bot.name || undefined,
      isBounce: true,
      durationMs: Math.max(0, Number(input.durationMs || 0)),
      reachedCart: input.event === 'cart' || path === '/carrito',
      reachedCheckout: input.event === 'checkout',
      purchased: input.event === 'purchase',
      newsletter: input.event === 'newsletter',
      conversionValue: Math.max(0, Number(input.value || 0)),
      ipHash: hashIp(input.ip),
    }
    try {
      await payload.create({
        collection: 'visit-sessions',
        overrideAccess: true,
        data,
      })
    } catch {
      const raced = await payload.find({
        collection: 'visit-sessions',
        where: sessionWhere(sessionId),
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (raced.docs[0]) {
        await payload.update({
          collection: 'visit-sessions',
          id: raced.docs[0].id,
          overrideAccess: true,
          data: { lastSeenAt: now, exitPath: path },
        })
      }
    }
  } else {
    const paths = asPathList(current.pathLog)
    const isNewPage = input.event === 'pageview' && paths[paths.length - 1] !== path
    if (isNewPage) {
      paths.push(path)
      if (paths.length > MAX_PATHS) paths.splice(0, paths.length - MAX_PATHS)
    }
    const pageCount = isNewPage ? Number(current.pageCount || 0) + 1 : Number(current.pageCount || 1)
    const durationMs = Math.max(Number(current.durationMs || 0), Number(input.durationMs || 0))
    await payload.update({
      collection: 'visit-sessions',
      id: current.id,
      overrideAccess: true,
      data: {
        lastSeenAt: now,
        exitPath: input.event === 'pageview' ? path : current.exitPath || path,
        pageCount,
        pathLog: paths,
        isBounce: pageCount <= 1,
        durationMs,
        reachedCart: Boolean(current.reachedCart) || input.event === 'cart' || path === '/carrito',
        reachedCheckout: Boolean(current.reachedCheckout) || input.event === 'checkout',
        purchased: Boolean(current.purchased) || input.event === 'purchase',
        newsletter: Boolean(current.newsletter) || input.event === 'newsletter',
        conversionValue: Math.max(Number(current.conversionValue || 0), Number(input.value || 0)),
        utmSource: current.utmSource || clip(input.utmSource, 80) || undefined,
        utmMedium: current.utmMedium || clip(input.utmMedium, 80) || undefined,
        utmCampaign: current.utmCampaign || clip(input.utmCampaign, 80) || undefined,
        utmContent: current.utmContent || clip(input.utmContent, 80) || undefined,
        utmTerm: current.utmTerm || clip(input.utmTerm, 80) || undefined,
        referrer: current.referrer || referrer || undefined,
        referrerHost: current.referrerHost || host || undefined,
        channel: current.channel || channel,
      },
    })
  }

  await maybeCleanup(payload, Number(settings?.analyticsRetentionDays || 90))
}

async function maybeCleanup(payload: Payload, retentionDays: number) {
  const now = Date.now()
  if (now - lastCleanup < 6 * 60 * 60 * 1000) return
  if (Math.random() > 0.08) return
  lastCleanup = now
  const cutoff = new Date(now - Math.max(14, retentionDays) * 24 * 60 * 60 * 1000).toISOString()
  try {
    await payload.delete({
      collection: 'visit-sessions',
      overrideAccess: true,
      where: { startedAt: { less_than: cutoff } },
    })
  } catch {
    /* la limpieza no debe romper el registro */
  }
}
