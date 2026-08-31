import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const value = trimmed.slice(eq + 1).trim()
  if (key) process.env[key] = value
}

process.env.NODE_ENV = 'development'

const { getPayload } = await import('payload')
const { default: config } = await import(pathToFileURL(resolve(root, 'src/payload.config.ts')).href)

const payload = await getPayload({ config })
console.log('Esquema de Payload sincronizado con Supabase.')
process.exit(0)
