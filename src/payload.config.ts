import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { buildConfig } from 'payload'
import { es } from 'payload/i18n/es'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Categories } from './collections/Categories'
import { Coupons } from './collections/Coupons'
import { Customers } from './collections/Customers'
import { StoreSettings } from './globals/StoreSettings'
import { HomeHero } from './globals/HomeHero'
import { storeEmailAdapter } from './email/storeEmailAdapter'
import {
  cloudinaryAdapter,
  cloudinaryFileUrl,
  getCloudinaryEnv,
  isCloudinaryConfigured,
} from './storage/cloudinaryAdapter'
import { originList } from './lib/origins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isVercel = Boolean(process.env.VERCEL)

function getDatabaseUri() {
  let uri = process.env.DATABASE_URI || ''
  if (!uri) return ''

  // Session pooler (5432) = máx. 15 sesiones en free; las lambdas las dejan colgadas.
  // Transaction pooler (6543) suelta el backend al terminar cada query (modo serverless).
  if (isVercel) {
    uri = uri.replace(/pooler\.supabase\.com:5432/gi, 'pooler.supabase.com:6543')
  }

  if (uri.includes('uselibpqcompat=')) return uri
  return uri.includes('?')
    ? `${uri}&uselibpqcompat=true`
    : `${uri}?sslmode=require&uselibpqcompat=true`
}

const databaseUri = getDatabaseUri()

if (isVercel) {
  const host = databaseUri.match(/@([^/?]+)/)?.[1] || 'sin-host'
  console.info('[kaprichos:db] pooler', host)
}

function postgresPool() {
  return {
    connectionString: databaseUri,
    // Payload llama pool.connect() al iniciar y no libera ese cliente (listener de ECONNRESET).
    // Con max: 1 las queries no tienen slot → "timeout exceeded when trying to connect".
    // 6543 (transaction) aguanta varios clientes TCP sin gastar las 15 sesiones del Session pooler.
    max: isVercel ? 3 : 5,
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ssl: {
      rejectUnauthorized: false,
    },
  }
}

const { folder: cloudinaryFolder } = getCloudinaryEnv()

const publicOrigins = originList()
const serverURL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

export default buildConfig({
  admin: {
    user: Users.slug,
    dateFormat: 'dd/MM/yyyy HH:mm',
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, 'app/(cms)/admin/importMap.js'),
    },
    meta: {
      titleSuffix: ' | Kaprichos',
      icons: [
        {
          rel: 'icon',
          type: 'image/webp',
          url: '/logo-kaprichos.webp',
        },
      ],
    },
    theme: 'dark',
    components: {
      graphics: {
        Logo: '/graphics/Logo',
        Icon: '/graphics/Icon',
      },
      providers: ['/graphics/AdminDefaults'],
      beforeNav: ['/graphics/NavBrand'],
    },
  },
  collections: [Users, Media, Categories, Products, Orders, Coupons, Customers],
  globals: [StoreSettings, HomeHero],
  i18n: {
    fallbackLanguage: 'es',
    supportedLanguages: { es },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  // Payload llama `email({ payload })` en runtime; el tipo público espera el adapter ya resuelto.
  email: storeEmailAdapter as never,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: postgresPool(),
    // En Vercel el push de esquema en cada cold start abre conexiones de más y satura el pooler.
    // El schema se actualiza en local (`npm run dev`) contra la misma base de Supabase.
    push: !isVercel && process.env.PAYLOAD_DISABLE_PUSH !== 'true',
    disableCreateDatabase: isVercel,
    ...(isVercel ? { transactionOptions: false as const } : {}),
  }),
  sharp,
  serverURL,
  csrf: publicOrigins,
  cors: publicOrigins,
  plugins: [
    cloudStoragePlugin({
      enabled: isCloudinaryConfigured(),
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          prefix: cloudinaryFolder,
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => cloudinaryFileUrl(filename, prefix),
        },
      },
    }),
  ],
})
