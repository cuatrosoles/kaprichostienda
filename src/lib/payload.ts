import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

const globalForPayload = globalThis as typeof globalThis & {
  __kaprichosPayload?: Promise<Payload>
  __kaprichosDbLock?: Promise<void>
}

export function payloadClient() {
  if (!globalForPayload.__kaprichosPayload) {
    globalForPayload.__kaprichosPayload = getPayload({ config })
  }
  return globalForPayload.__kaprichosPayload
}

/** Una query a la vez: en Vercel el pool es de 1 y Promise.all satura el connect. */
export async function withPayload<T>(fn: (payload: Payload) => Promise<T>): Promise<T> {
  const prev = globalForPayload.__kaprichosDbLock ?? Promise.resolve()
  let release!: () => void
  globalForPayload.__kaprichosDbLock = new Promise<void>((resolve) => {
    release = resolve
  })
  await prev
  try {
    const payload = await payloadClient()
    return await fn(payload)
  } finally {
    release()
  }
}
