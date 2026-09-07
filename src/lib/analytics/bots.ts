const BOT_PATTERNS: Array<{ name: string; test: RegExp }> = [
  { name: 'Googlebot', test: /googlebot|google-inspectiontool|google-extended|adsbot-google|mediapartners-google|storebot-google/i },
  { name: 'Bingbot', test: /bingbot|adidxbot|msnbot/i },
  { name: 'DuckDuckBot', test: /duckduckbot|duckduckgo/i },
  { name: 'Yandex', test: /yandexbot|yandeximages|yandex.com\/bots/i },
  { name: 'Baidu', test: /baiduspider/i },
  { name: 'Applebot', test: /applebot/i },
  { name: 'Facebook', test: /facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher/i },
  { name: 'WhatsApp', test: /whatsapp/i },
  { name: 'Twitter', test: /twitterbot|xbot/i },
  { name: 'LinkedIn', test: /linkedinbot/i },
  { name: 'Pinterest', test: /pinterestbot|pinterest\/0\./i },
  { name: 'TikTok', test: /tiktok|bytespider|bytedance/i },
  { name: 'Slack', test: /slackbot|slack-imgproxy/i },
  { name: 'Telegram', test: /telegrambot/i },
  { name: 'Discord', test: /discordbot/i },
  { name: 'Ahrefs', test: /ahrefsbot|ahrefssiteaudit/i },
  { name: 'Semrush', test: /semrushbot|semrush/i },
  { name: 'Moz', test: /dotbot|moz\.com/i },
  { name: 'Majestic', test: /mj12bot/i },
  { name: 'Screaming Frog', test: /screaming frog/i },
  { name: 'GPTBot', test: /gptbot|chatgpt-user|oai-searchbot/i },
  { name: 'ClaudeBot', test: /claudebot|anthropic-ai|claude-web/i },
  { name: 'Perplexity', test: /perplexitybot/i },
  { name: 'CCBot', test: /ccbot/i },
  { name: 'PetalBot', test: /petalbot/i },
  { name: 'Yahoo', test: /slurp/i },
  { name: 'Pingdom', test: /pingdom/i },
  { name: 'UptimeRobot', test: /uptimerobot/i },
  { name: 'Headless', test: /headlesschrome|phantomjs|puppeteer|playwright/i },
  { name: 'Generic crawler', test: /crawler|spider|scraper|archiv|wget|curl\/|python-requests|go-http-client|libwww|scrapy/i },
]

export type BotMatch = { isBot: true; name: string } | { isBot: false; name: '' }

export function detectBot(userAgent: string): BotMatch {
  const ua = (userAgent || '').trim()
  if (!ua) return { isBot: true, name: 'Empty UA' }
  for (const bot of BOT_PATTERNS) {
    if (bot.test.test(ua)) return { isBot: true, name: bot.name }
  }
  return { isBot: false, name: '' }
}

export function isStorePath(pathname: string) {
  if (!pathname || pathname === '/') return true
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/catalog/')
  ) {
    return false
  }
  if (/\.(?:js|css|map|png|jpe?g|webp|gif|svg|ico|woff2?|txt|xml|json)$/i.test(pathname)) return false
  return true
}
