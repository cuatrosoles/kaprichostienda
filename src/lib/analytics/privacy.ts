import { createHash } from 'node:crypto'

export function hashIp(ip: string) {
  const secret = process.env.PAYLOAD_SECRET || 'kaprichos'
  return createHash('sha256')
    .update(`${secret}|${ip}`)
    .digest('hex')
    .slice(0, 32)
}

export function cleanPath(raw: unknown) {
  const value = String(raw || '/').trim() || '/'
  try {
    const url = new URL(value, 'https://kaprichos.local')
    let path = url.pathname || '/'
    if (path.length > 180) path = path.slice(0, 180)
    return path
  } catch {
    return '/'
  }
}

export function clip(value: unknown, max = 160) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, max)
}

export function argentinaNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
}

export function arDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export function arDayBounds(fromKey: string, toKey: string) {
  return {
    from: new Date(`${fromKey}T00:00:00-03:00`),
    to: new Date(`${toKey}T23:59:59.999-03:00`),
  }
}
