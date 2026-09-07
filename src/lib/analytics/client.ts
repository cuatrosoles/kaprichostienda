const VID = 'kaprichos_vid'
const SID = 'kaprichos_sid'
const SID_AT = 'kaprichos_sid_at'
const UTM = 'kaprichos_utm'
const SESSION_MS = 30 * 60 * 1000

export type StoreAnalyticsEvent = 'pageview' | 'ping' | 'cart' | 'checkout' | 'purchase' | 'newsletter'

function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function writeCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.round(days * 86400)}; SameSite=Lax`
}

function randomId(prefix: string) {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`
  return `${prefix}${id}`
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VID) || readCookie(VID)
    if (!id) id = randomId('v_')
    localStorage.setItem(VID, id)
    writeCookie(VID, id, 390)
    return id
  } catch {
    return randomId('v_')
  }
}

function getSessionId() {
  try {
    const started = Number(sessionStorage.getItem(SID_AT) || localStorage.getItem(SID_AT) || 0)
    let id = sessionStorage.getItem(SID) || readCookie(SID)
    if (!id || Date.now() - started > SESSION_MS) {
      id = randomId('s_')
    }
    sessionStorage.setItem(SID, id)
    sessionStorage.setItem(SID_AT, String(Date.now()))
    writeCookie(SID, id, 0.02)
    return id
  } catch {
    return randomId('s_')
  }
}

function readUtms() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = {
    utmSource: params.get('utm_source') || (params.get('gclid') ? 'google' : params.get('fbclid') ? 'facebook' : ''),
    utmMedium:
      params.get('utm_medium') || (params.get('gclid') ? 'cpc' : params.get('fbclid') ? 'paid' : ''),
    utmCampaign: params.get('utm_campaign') || '',
    utmContent: params.get('utm_content') || '',
    utmTerm: params.get('utm_term') || '',
  }
  const hasUtm = Object.values(fromUrl).some(Boolean)
  if (hasUtm) {
    try {
      sessionStorage.setItem(UTM, JSON.stringify(fromUrl))
    } catch {
      /* ignore */
    }
    return fromUrl
  }
  try {
    return JSON.parse(sessionStorage.getItem(UTM) || '{}') as typeof fromUrl
  } catch {
    return fromUrl
  }
}

export function trackStoreEvent(
  event: StoreAnalyticsEvent,
  extra?: { path?: string; title?: string; value?: number; durationMs?: number },
) {
  if (typeof window === 'undefined') return
  try {
    const utm = readUtms()
    const body = JSON.stringify({
      event,
      path: extra?.path || window.location.pathname || '/',
      title: extra?.title || document.title || '',
      referrer: document.referrer || '',
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      durationMs: extra?.durationMs || 0,
      value: extra?.value || 0,
      ...utm,
    })
    void fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    /* la analítica no debe romper la tienda */
  }
}
