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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function getDatabaseUri() {
  const uri = process.env.DATABASE_URI || ''
  if (!uri) return ''
  if (uri.includes('uselibpqcompat=')) return uri
  return uri.includes('?')
    ? `${uri}&uselibpqcompat=true`
    : `${uri}?sslmode=require&uselibpqcompat=true`
}

const isVercel = process.env.VERCEL === '1'

function postgresPool() {
  return {
    connectionString: getDatabaseUri(),
    // Supabase Session pooler (free) admite ~15 clientes. En Vercel cada lambda
    // abre su propio pool: max 1. En local, 3 para no comerse el cupo si también hay deploy.
    max: isVercel ? 1 : 3,
    min: 0,
    idleTimeoutMillis: isVercel ? 5000 : 10_000,
    connectionTimeoutMillis: 8000,
    allowExitOnIdle: true,
    maxUses: 50,
    maxLifetimeSeconds: 60,
    ssl: {
      rejectUnauthorized: false,
    },
  }
}

const { folder: cloudinaryFolder } = getCloudinaryEnv()

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
    components: {
      graphics: {
        Logo: '/graphics/Logo',
        Icon: '/graphics/Icon',
      },
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
  }),
  sharp,
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
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
