import { NextResponse } from 'next/server'
import { ingestVisit, type AnalyticsEventName } from '@/lib/analytics/ingest'
import { isStorePath } from '@/lib/analytics/bots'
import { cleanPath } from '@/lib/analytics/privacy'
import { clientIp, rateLimit } from '@/lib/auth'
import { requestOriginAllowed } from '@/lib/origins'

export const runtime = 'nodejs'
export const maxDuration = 30

const EVENTS: AnalyticsEventName[] = ['pageview', 'ping', 'cart', 'checkout', 'purchase', 'newsletter']

function ok() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: Request) {
  try {
    if (!requestOriginAllowed(req) && req.headers.get('x-kaprichos-analytics') !== 'bot') {
      return ok()
    }
    const ip = clientIp(req)
    if (!rateLimit(`analytics:${ip}`, 90, 60_000)) return ok()

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const event = EVENTS.includes(body.event as AnalyticsEventName)
      ? (body.event as AnalyticsEventName)
      : 'pageview'
    const path = cleanPath(body.path)
    if (!isStorePath(path)) return ok()

    await ingestVisit({
      event,
      path,
      title: String(body.title || ''),
      referrer: String(body.referrer || req.headers.get('referer') || ''),
      visitorId: String(body.visitorId || ''),
      sessionId: String(body.sessionId || ''),
      utmSource: String(body.utmSource || ''),
      utmMedium: String(body.utmMedium || ''),
      utmCampaign: String(body.utmCampaign || ''),
      utmContent: String(body.utmContent || ''),
      utmTerm: String(body.utmTerm || ''),
      durationMs: Number(body.durationMs || 0),
      value: Number(body.value || 0),
      headers: req.headers,
      ip,
    })
    return ok()
  } catch {
    return ok()
  }
}
