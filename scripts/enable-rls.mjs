import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

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

function getDatabaseUri() {
  const uri = process.env.DATABASE_URI || ''
  if (!uri) throw new Error('Falta DATABASE_URI')
  if (uri.includes('uselibpqcompat=')) return uri
  return uri.includes('?')
    ? `${uri}&uselibpqcompat=true`
    : `${uri}?sslmode=require&uselibpqcompat=true`
}

const sql = readFileSync(resolve(root, 'scripts/supabase-enable-rls.sql'), 'utf8')
const client = new pg.Client({
  connectionString: getDatabaseUri(),
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)

const { rows } = await client.query(`
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY 1
`)

console.log(`RLS activado en ${rows.length} tablas públicas.`)
for (const row of rows) {
  console.log(`  ${row.table_name}: ${row.rls_enabled ? 'RLS on' : 'RLS off'}`)
}

await client.end()
