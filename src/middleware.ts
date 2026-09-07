import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectBot, isStorePath } from '@/lib/analytics/bots'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!isStorePath(pathname)) return NextResponse.next()

  const ua = request.headers.get('user-agent') || ''
  const bot = detectBot(ua)
  if (!bot.isBot) return NextResponse.next()

  const ingestUrl = new URL('/api/analytics/collect', request.nextUrl.origin)
  void fetch(ingestUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-kaprichos-analytics': 'bot',
      'user-agent': ua,
      'x-forwarded-for': request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      'x-vercel-ip-country': request.headers.get('x-vercel-ip-country') || '',
      'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region') || '',
      'x-vercel-ip-city': request.headers.get('x-vercel-ip-city') || '',
    },
    body: JSON.stringify({
      event: 'pageview',
      path: pathname,
      referrer: request.headers.get('referer') || '',
      visitorId: `bot_${bot.name}`,
      sessionId: '',
      title: bot.name,
    }),
  }).catch(() => {})

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!admin|api|_next|catalog|favicon.ico|logo-kaprichos.webp).*)'],
}
