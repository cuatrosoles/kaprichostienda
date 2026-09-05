function addOrigin(origins: Set<string>, raw?: string | null) {
  if (!raw) return
  for (const piece of raw.split(',')) {
    let value = piece.trim().replace(/\/$/, '')
    if (!value) continue
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`
    try {
      const url = new URL(value)
      origins.add(url.origin)
      const host = url.hostname
      if (host.startsWith('www.')) {
        origins.add(`${url.protocol}//${host.slice(4)}`)
      } else if (host.includes('.')) {
        origins.add(`${url.protocol}//www.${host}`)
      }
    } catch {
      origins.add(value)
    }
  }
}

export function originList(): string[] {
  const origins = new Set<string>()
  addOrigin(origins, process.env.NEXT_PUBLIC_SERVER_URL)
  addOrigin(origins, process.env.NEXT_PUBLIC_WEBHOOK_URL)
  addOrigin(origins, process.env.ALLOWED_ORIGINS)
  addOrigin(origins, process.env.VERCEL_PROJECT_PRODUCTION_URL)
  addOrigin(origins, process.env.VERCEL_URL)
  addOrigin(origins, process.env.VERCEL_BRANCH_URL)
  addOrigin(origins, 'http://localhost:3000')
  addOrigin(origins, 'http://127.0.0.1:3000')
  addOrigin(origins, 'https://kaprichostienda.com.ar')
  return [...origins]
}

export function requestOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true

  const allowed = new Set(originList())
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]
    .trim()
  const protoHeader = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim()
  const proto = protoHeader === 'http' ? 'http' : 'https'
  if (host) {
    addOrigin(allowed, `${proto}://${host}`)
  }

  return allowed.has(origin.replace(/\/$/, ''))
}
