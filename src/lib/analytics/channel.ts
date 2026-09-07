const SOCIAL_HOSTS = [
  'instagram.com',
  'l.instagram.com',
  'facebook.com',
  'm.facebook.com',
  'l.facebook.com',
  'fb.com',
  'tiktok.com',
  'pinterest.com',
  'x.com',
  't.co',
  'twitter.com',
  'youtube.com',
  'youtu.be',
  'wa.me',
  'web.whatsapp.com',
  'linkedin.com',
  'threads.net',
]

const SEARCH_HOSTS = ['google.', 'bing.com', 'duckduckgo.com', 'yahoo.', 'ecosia.org', 'search.brave.com']

const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'ads', 'paid-social', 'paidsocial', 'display', 'cpm']

export type Channel = 'direct' | 'organic' | 'social' | 'paid' | 'referral' | 'bot'

function hostOf(referrer: string) {
  if (!referrer) return ''
  try {
    return new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export function classifyChannel(input: {
  isBot: boolean
  referrer: string
  utmSource?: string
  utmMedium?: string
  ownHost?: string
}): Channel {
  if (input.isBot) return 'bot'
  const medium = String(input.utmMedium || '').toLowerCase()
  const source = String(input.utmSource || '').toLowerCase()
  if (PAID_MEDIUMS.includes(medium) || source === 'googleads' || source === 'fbads' || source === 'meta') {
    return 'paid'
  }
  if (medium === 'social' || SOCIAL_HOSTS.some((h) => source.includes(h.replace('.com', '')))) return 'social'
  if (medium === 'organic' || medium === 'seo') return 'organic'
  if (medium === 'email' || medium === 'referral') return medium === 'email' ? 'referral' : 'referral'

  const host = hostOf(input.referrer)
  if (!host || host === input.ownHost) return source || medium ? 'referral' : 'direct'
  if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return 'social'
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return 'organic'
  return 'referral'
}

export function referrerHost(referrer: string, ownHost?: string) {
  const host = hostOf(referrer)
  if (!host || host === ownHost) return ''
  return host
}
